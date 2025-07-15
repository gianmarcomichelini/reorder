'use strict'

const { test, assert } = require('../test');
const {
    getUserOrders,
    getOrder,
    createOrder,
} = require('../../dao/dao-orders');
const dayjs = require('dayjs');

test('getUserOrders returns orders made by a user', async () => {
    try {
        const orders = await getUserOrders(1);
        orders.forEach(o => {
            o.timestamp = dayjs(o.timestamp).format();
        });
        // console.log('User orders:', orders);
        assert.ok(Array.isArray(orders));
    } catch (err) {
        assert.fail(err);
    }
});

test('getOrder returns a specific order based on orderId', async () => {
    try {
        const order = await getOrder(2);
        order.timestamp = dayjs(order.timestamp).format();
        // console.log('Order:', order);
        assert.ok(order && order.id === 2);
    } catch (err) {
        assert.fail(err);
    }
});


test('createOrder inserts an order and returns orderId', async () => {
    const userId = 1;
    const order = {
        size_name: 'medium',
        dish_name: 'pizza',
        ingredients: [
            { ingredient_name: 'olives' },
            { ingredient_name: 'tomatoes' }
        ]
    };
    try {
        const orderId = await createOrder(userId, order);
        assert.ok(orderId && typeof orderId === 'number' && orderId > 0);
    } catch (err) {
        assert.fail(err);
    }
});