'use strict';

const db = require('./db');
const dayjs = require('dayjs');

/**
 * Executes a SQL SELECT query returning multiple rows.
 * @param {string} sql - SQL query string.
 * @param {Array} [params=[]] - Query parameters.
 * @returns {Promise<Array>} - Resolves with array of rows.
 */
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
}

/**
 * Executes a SQL SELECT query returning a single row.
 * @param {string} sql - SQL query string.
 * @param {Array} [params=[]] - Query parameters.
 * @returns {Promise<Object>} - Resolves with a single row.
 */
function runGet(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)));
    });
}


/**
 * Loads database entities and builds lookup maps by 'id' or 'name'.
 * @param {'id' | 'name'} key - Lookup key type.
 * @returns {Promise<Object>} - Object with lookup maps.
 */
async function loadAndBuildLookupMaps(key) {
    const [sizes, ingredients, dishes, users] = await Promise.all([
        getSizes(),
        getIngredients(),
        getDishes(),
        getUsers()
    ]);

    const buildMap = (arr, keyProp, valueBuilder) =>
        Object.fromEntries(arr.map(item => [item[keyProp], valueBuilder(item)]));

    if (key === 'name') {
        return {
            sizeByName: buildMap(sizes, 'name', s => ({
                id: s.id,
                price: s.price,
                maxIngredients: s.maxIngredients
            })),
            ingredientByName: buildMap(ingredients, 'name', i => ({
                id: i.id,
                price: i.price,
                stock: i.availability,
                unlimited: i.unlimited === 1    // returns true if the ingredient has undefined availability
            })),
            dishByName: buildMap(dishes, 'name', d => ({
                id: d.id,
                description: d.description
            })),
            userByName: buildMap(users, 'name', u => ({
                id: u.id,
                name: u.name
            })),
        };
    }

    if (key === 'id') {
        return {
            sizeById: buildMap(sizes, 'id', s => ({
                name: s.name,
                price: s.price,
                maxIngredients: s.maxIngredients
            })),
            ingredientById: buildMap(ingredients, 'id', i => ({
                name: i.name,
                price: i.price,
                stock: i.availability,
                unlimited: i.unlimited === 1
            })),
            dishById: buildMap(dishes, 'id', d => ({
                name: d.name,
                description: d.description
            })),
            userById: buildMap(users, 'id', u => ({
                name: u.name
            })),
        };
    }

    throw new Error(`Unknown key '${key}' for lookup maps`);
}

/* ===== Basic Entity Getters ===== */

/**
 * Fetches all available sizes.
 * @returns {Promise<Array>} - List of size objects.
 */
async function getSizes() {
    return runQuery(`SELECT size_id AS id, size_name AS name, size_price AS price, size_max_ingredients AS maxIngredients FROM sizes`);
}

async function getIngredients() {
    return runQuery(`SELECT ingredient_id AS id, ingredient_name AS name, ingredient_price AS price, ingredient_stock_quantity AS availability, ingredient_is_unlimited AS unlimited FROM ingredients`);
}

async function getDishes() {
    return runQuery(`SELECT dish_id AS id, dish_name AS name, dish_description AS description FROM dishes`);
}

async function getUsers() {
    return runQuery(`SELECT user_username AS name FROM users`);
}

async function getDependencies() {
    return runQuery('SELECT \n' +
        '  i1.ingredient_name AS ingredient1,\n' +
        '  i2.ingredient_name AS ingredient2\n' +
        'FROM ingredient_dependencies d\n' +
        'JOIN ingredients i1 ON d.ingredient_dependency_ingredient_id = i1.ingredient_id\n' +
        'JOIN ingredients i2 ON d.ingredient_dependency_required_ingredient_id = i2.ingredient_id;')
}

async function getIncompatibilities() {
    return runQuery('SELECT \n' +
        '  i1.ingredient_name AS ingredient1,\n' +
        '  i2.ingredient_name AS ingredient2\n' +
        'FROM ingredient_incompatibilities inc\n' +
        'JOIN ingredients i1 ON inc.ingredient_incompatibility_ingredient_id_1 = i1.ingredient_id\n' +
        'JOIN ingredients i2 ON inc.ingredient_incompatibility_ingredient_id_2 = i2.ingredient_id;')
}


/**
 * Gets ingredients used in a specific order.
 * @param {number} orderId - Order ID.
 * @returns {Promise<Array>} - List of ingredient objects.
 */
async function getIngredientsInOrder(orderId) {
    const sql = `
        SELECT i.ingredient_name AS name, i.ingredient_price AS price
        FROM ingredient_lines il
        JOIN ingredients i ON il.ingredient_id = i.ingredient_id
        WHERE il.order_id = ?`;
    return runQuery(sql, [orderId]);
}

/**
 * Checks if a user exists.
 * @param {number} userId - User ID.
 * @returns {Promise<boolean>}
 */
async function userExists(userId) {
    const row = await runGet('SELECT 1 FROM users WHERE user_id = ? LIMIT 1', [userId]);
    return !!row;
}


/**
 * Checks if an order exists.
 * @param {number} orderId - Order ID.
 * @returns {Promise<boolean>}
 */
async function orderExists(orderId) {
    const row = await runGet('SELECT 1 FROM orders WHERE order_id = ? LIMIT 1', [orderId]);
    return !!row;
}


/* ===== Validation ===== */


/**
 * Gets all incompatible ingredients for a given ingredient ID.
 * @param {number} ingredientId
 * @returns {Promise<Array>} - List of incompatible ingredient IDs.
 */
async function getIncompatibilitiesById(ingredientId) {
    // ingredient incompatibility is bidirectional
    const sql = `
        SELECT ingredient_incompatibility_ingredient_id_2 AS incompatible_id
        FROM ingredient_incompatibilities
        WHERE ingredient_incompatibility_ingredient_id_1 = ?
        UNION
        SELECT ingredient_incompatibility_ingredient_id_1 AS incompatible_id
        FROM ingredient_incompatibilities
        WHERE ingredient_incompatibility_ingredient_id_2 = ?`;
    return runQuery(sql, [ingredientId, ingredientId]);
}

/**
 * Gets required ingredients (dependencies) for a given ingredient ID.
 * @param {number} ingredientId
 * @returns {Promise<Array>} - List of required ingredient IDs.
 */
async function getDependenciesById(ingredientId) {
    const sql = `
        SELECT ingredient_dependency_required_ingredient_id AS required_id
        FROM ingredient_dependencies
        WHERE ingredient_dependency_ingredient_id = ?`;
    return runQuery(sql, [ingredientId]);
}

/**
 * Validates maximum number of ingredients based on size.
 * @param {Object} orderMeta - Order metadata.
 * @param {Object} sizeByName - Lookup map of sizes.
 */
function validateMaxIngredients(orderMeta, sizeByName) {
    const max = sizeByName[orderMeta.size_name]?.maxIngredients;
    //console.log(max)
    if (!max) {
        throw new Error(`Size name '${orderMeta.size_name}' not found`);
    }
    if ((orderMeta.ingredients?.length ?? 0) > max) {
        throw new Error(`Order exceeds max ingredient limit for size '${orderMeta.size_name}' (max ${max})`);
    }
}

/**
 * Checks if ingredient stock is sufficient.
 * @param {Array} clientIngredients - Ingredient list.
 * @param {Object} ingredientByName - Lookup map.
 */
function checkIngredientStock(clientIngredients, ingredientByName) {
    for (const ing of clientIngredients) {
        const data = ingredientByName[ing.ingredient_name];

        if (!data) {
            throw new Error(`Invalid ingredient ID: ${ing.ingredient_name}`);
        }
        if (!data.unlimited && Number(data.stock) < 1) {
            throw new Error(`Insufficient stock for ingredient: ${ing.ingredient_name}`);
        }
    }
}

/**
 * Validates ingredient incompatibilities in an order.
 * @param {number} orderId - Order ID.
 * @param {Object} ingredientIds - Map of ingredient names to IDs.
 */
async function checkIncompatibilities(orderId, ingredientIds) {
    const ingredientNames = Object.keys(ingredientIds);
    for (let i = 0; i < ingredientNames.length; i++) {
        const name1 = ingredientNames[i];
        const id1 = ingredientIds[name1];
        const incompatibilities = (await getIncompatibilitiesById(id1)).map(r => r.incompatible_id);
        const incompatSet = new Set(incompatibilities);
        for (let j = i + 1; j < ingredientNames.length; j++) {
            const name2 = ingredientNames[j];
            const id2 = ingredientIds[name2];
            if (incompatSet.has(id2)) {
                throw new Error(`Incompatibility found in order ${orderId}: ${name1} is incompatible with ${name2}`);
            }
        }
    }
}

/**
 * Validates ingredient dependencies in an order.
 * @param {Object} order - Order object.
 * @param {Object} ingredientIds - Map of ingredient names to IDs.
 */
async function checkDependencies(order, ingredientIds) {
    const ingredientIdSet = new Set(Object.values(ingredientIds));
    for (const [name, id] of Object.entries(ingredientIds)) {
        const requiredIds = (await getDependenciesById(id)).map(r => r.required_id);
        const missingDeps = requiredIds.filter(depId => !ingredientIdSet.has(depId));
        if (missingDeps.length > 0) {
            // Retrieve missing ingredient names
            const missingNames = await Promise.all(missingDeps.map(depId =>
                runGet(`SELECT ingredient_name FROM ingredients WHERE ingredient_id = ?`, [depId])
                    .then(row => row?.ingredient_name ?? `id ${depId}`)
            ));
            throw new Error(`Missing dependency in order ${order.id}: ${name} requires ${missingNames.join(", ")}`);
        }
    }
}

/**
 * Validates both incompatibilities and dependencies.
 * @param {Object} order
 * @param {Object} ingredientByName
 * @returns {Promise<true>}
 */
async function validateOrderIncompatibilitiesAndDependencies(order, ingredientByName) {
    const listOfIngredientsInOrderByIds = {};
    for (const ing of order.ingredients) {
        const ingData = ingredientByName[ing.ingredient_name];
        listOfIngredientsInOrderByIds[ing.ingredient_name] = ingData.id;
    }

    await checkIncompatibilities(order.id, listOfIngredientsInOrderByIds);
    await checkDependencies(order, listOfIngredientsInOrderByIds);
    return true;
}


/* ===== Order Metadata Computation ===== */

/**
 * Computes metadata and total price for a new order.
 * @param {Object} order - Raw order input.
 * @param {Object} sizeByName
 * @param {Object} ingredientByName
 * @param {Object} dishByName
 * @returns {Object} - { orderMeta, totalPrice }
 */
function computeOrderMetadata(order, sizeByName, ingredientByName, dishByName) {
    const size = sizeByName[order.size_name];
    if (!size) throw new Error(`Invalid size_name: ${order.size_name}`);

    const baseDish = dishByName[order.dish_name];
    if (!baseDish) throw new Error(`Invalid dish name: ${order.dish_name}`);


    const ingredientNames = order.ingredients.map(ing => ing.ingredient_name);
    const uniqueIngredientNames = new Set(ingredientNames);

    // Compare lengths to detect duplicates
    if (uniqueIngredientNames.size !== ingredientNames.length) {
        throw new Error('Duplicate ingredients are not allowed');
    }

    const ingredientList = [];
    let ingredientTotal = 0;

    for (const ing of order.ingredients) {
        const ingData = ingredientByName[ing.ingredient_name];
        if (!ingData) throw new Error(`Invalid ingredient_name: ${ing.ingredient_name}`);
        ingredientTotal += Number(ingData.price);
        ingredientList.push({id: ingData.id});
    }

    const totalPrice = Number(size.price) + ingredientTotal;
    //console.log(baseDish)

    return {
        orderMeta: {
            dish_id: baseDish.id,
            size_id: size.id,
            size_name: order.size_name,
            order_price: totalPrice,
            ingredients: ingredientList,
        },
        totalPrice,
    };
}

/* ===== Core Order Workflow ===== */

/**
 * Validates an order's constraints.
 * @param {Object} order
 * @param {Object} sizeByName
 * @param {Object} ingredientByName
 * @returns {Promise<void>}
 */
async function validateOrder(order, sizeByName, ingredientByName) {
    validateMaxIngredients(order, sizeByName);
    checkIngredientStock(order.ingredients, ingredientByName);
    await validateOrderIncompatibilitiesAndDependencies(order, ingredientByName);
}

/**
 * Inserts a new order and related ingredient lines.
 * @param {number} userId
 * @param {number} totalPrice
 * @param {Object} orderMeta
 * @returns {Promise<number>} - New order ID.
 */
async function insertOrder(userId, totalPrice, orderMeta) {
    return new Promise((resolve, reject) => {
        //console.log(orderMeta)
        const sqlOrder = `INSERT INTO orders (user_id, dish_id, size_id, order_price) VALUES (?, ?, ?, ?)`;
        db.run(sqlOrder, [userId, orderMeta.dish_id, orderMeta.size_id, totalPrice], function (err) {
            if (err) return reject(new Error(err.message));
            const orderId = this.lastID;

            const ingredientPromises = orderMeta.ingredients.map(ing => new Promise((res, rej) => {
                const sqlIngredientLine = `INSERT INTO ingredient_lines (order_id, ingredient_id) VALUES (?, ?)`;
                db.run(sqlIngredientLine, [orderId, ing.id], err2 => (err2 ? rej(new Error(err2.message)) : res()));
            }));

            Promise.all(ingredientPromises).then(() => resolve(orderId)).catch(reject);
        });
    });
}

/**
 * Updates stock by decrementing quantities for used ingredients.
 * @param {Array} usedIngredients
 * @returns {Promise<void>}
 */
async function updateStock(usedIngredients) {
    const updatePromises = usedIngredients.map(ing =>
        new Promise((resolve, reject) => {
            db.run(
                `UPDATE ingredients 
                SET ingredient_stock_quantity = ingredient_stock_quantity - 1  
                WHERE ingredient_id = ? AND ingredient_is_unlimited = 0`,
                [ing.id],
                err => (err ? reject(new Error(err.message)) : resolve())
            );
        })
    );
    await Promise.all(updatePromises);
}

/**
 * Full creation pipeline: validates, inserts, and returns order ID.
 * @param {number} userId
 * @param {Object} order
 * @returns {Promise<number>} - Created order ID.
 */
async function createOrder(userId, order) {
    if (!await userExists(userId)) {
        throw new Error(`User ${userId} does not exist`);
    }

    const {sizeByName, ingredientByName, dishByName} = await loadAndBuildLookupMaps('name');
    const {orderMeta, totalPrice} = computeOrderMetadata(order, sizeByName, ingredientByName, dishByName);

    await validateOrder(order, sizeByName, ingredientByName);

    const orderId = await insertOrder(userId, totalPrice, orderMeta);
    await updateStock(orderMeta.ingredients);

    return orderId;
}

// --- Fetching orders ---


/**
 * Builds a structured response for an order.
 * @param {Object} orderRow - Raw DB row.
 * @param {Object} sizeById
 * @param {Object} dishById
 * @param {Object} userById
 * @param {Array} ingredients
 * @returns {Object} - Enriched order object.
 */
function buildOrderResponse(orderRow, sizeById, dishById, userById, ingredients) {
    return {
        id: orderRow.order_id,
        price: orderRow.order_price,
        size: sizeById[orderRow.size_id].name || null,
        dish: dishById[orderRow.dish_id].name || null,
        timestamp: orderRow.order_timestamp ? dayjs(orderRow.order_timestamp).format('YYYY-MM-DD HH:mm:ss') : "",
        ingredients: ingredients.map(i => i.name),
    };
}

/**
 * Fetch orders based on optional filters.
 * - If orderId is provided, fetch that single order.
 * - Else if userId is provided, fetch all orders of that user.
 * - Else fetch all orders.
 * @param {Object} options
 * @param {number} [options.orderId]
 * @param {number} [options.userId]
 * @returns {Promise<Object|Array>} - Single order object or array of orders.
 */
async function getOrders({orderId, userId} = {}) {
    if (orderId !== undefined) {
        if (!await orderExists(orderId)) {
            throw new Error(`Order with ID ${orderId} not found`);
        }
        const orderRow = await runGet('SELECT * FROM orders WHERE order_id = ?', [orderId]);
        if (!orderRow) return null;

        const [{sizeById, dishById, userById}, ingredients] = await Promise.all([
            loadAndBuildLookupMaps('id'),
            getIngredientsInOrder(orderId)
        ]);

        return buildOrderResponse(orderRow, sizeById, dishById, userById, ingredients);
    } else if (userId !== undefined) {
        if (!await userExists(userId)) {
            throw new Error(`User with ID ${userId} not found`);
        }
        const orders = await runQuery('SELECT * FROM orders WHERE user_id = ?', [userId]);
        const {sizeById, dishById, userById} = await loadAndBuildLookupMaps('id');

        return Promise.all(orders.map(async orderRow => {
            const ingredients = await getIngredientsInOrder(orderRow.order_id);
            return buildOrderResponse(orderRow, sizeById, dishById, userById, ingredients);
        }));
    } else {
        const orders = await runQuery('SELECT * FROM orders');
        const {sizeById, dishById, userById} = await loadAndBuildLookupMaps('id');

        return Promise.all(orders.map(async orderRow => {
            const ingredients = await getIngredientsInOrder(orderRow.order_id);
            return buildOrderResponse(orderRow, sizeById, dishById, userById, ingredients);
        }));
    }

}

/**
 * Deletes an order and restores ingredient stock.
 * Only allows deletion if the order belongs to the user.
 * @param {number} orderId - ID of the order to delete.
 * @param {number} userId - ID of the requesting user.
 * @returns {Promise<number>}
 */
async function deleteOrder(orderId, userId) {
    const order = await runGet('SELECT * FROM orders WHERE order_id = ?', [orderId]);
    if (!order) {
        throw new Error(`Order with ID ${orderId} does not exist`);
    }

    // Check ownership
    if (order.user_id !== userId) {
        throw new Error(`Unauthorized: Order ${orderId} does not belong to user ${userId}`);
    }

    // Get ingredient IDs used in this order
    const usedIngredients = await runQuery(`
        SELECT il.ingredient_id
        FROM ingredient_lines il
        JOIN ingredients i ON il.ingredient_id = i.ingredient_id
        WHERE il.order_id = ? AND i.ingredient_is_unlimited = 0
    `, [orderId]);

    // Restore stock (only for ingredients with limited stock)
    const restorePromises = usedIngredients.map(ing =>
        new Promise((resolve, reject) => {
            db.run(
                `UPDATE ingredients SET ingredient_stock_quantity = ingredient_stock_quantity + 1 WHERE ingredient_id = ?`,
                [ing.ingredient_id],
                err => (err ? reject(new Error(err.message)) : resolve())
            );
        })
    );
    await Promise.all(restorePromises);

    // Delete ingredient lines
    await new Promise((resolve, reject) => {
        db.run(`DELETE FROM ingredient_lines WHERE order_id = ?`, [orderId], err =>
            err ? reject(new Error(err.message)) : resolve()
        );
    });

    // Delete the order
    await new Promise((resolve, reject) => {
        db.run(`DELETE FROM orders WHERE order_id = ?`, [orderId], err =>
            err ? reject(new Error(err.message)) : resolve()
        );
    });
    return orderId;

}


module.exports = {
    getSizes,
    getIngredients,
    getDishes,
    createOrder,
    getOrders,
    deleteOrder,
    getDependencies,
    getIncompatibilities,
};