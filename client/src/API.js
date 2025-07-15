const SERVER_URL = 'http://localhost:3001/api';

/**
 * A utility function for parsing the HTTP response.
 */
function getJson(httpResponsePromise) {
    // server API always return JSON, in case of error the format is the following { error: <message> }
    return new Promise((resolve, reject) => {
        httpResponsePromise
            .then((response) => {
                if (response.ok) {
                    // the server always returns a JSON, even empty {}. Never null or non json, otherwise the method will fail
                    response.json()
                        .then(json => resolve(json))
                        .catch(err => reject(err))

                } else {
                    // analyzing the cause of error
                    response.json()
                        .then(obj => reject(obj))
                }
            })
            .catch(() =>
                reject([{message: "Connection error"}])
            )
    });
}

const getMenu = async () => {
    return getJson(fetch(SERVER_URL + '/menu'))
        .then(menu => ({
            ingredients: menu.ingredients,
            sizes: menu.sizes,
            dishes: menu.dishes,
            incompatibilities: menu.incompatibilities,
            dependencies: menu.dependencies
        }));
};


const createOrder = async (order) => {
    return getJson(fetch(SERVER_URL + '/orders', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(order),
    }))
        .then(orderConfirm => ({
            orderId: orderConfirm.orderId,
            message: orderConfirm.message
        }))
        .catch(err => {
            //console.log(err);
            const errToThrow = err[0] ? err[0].path : err.message;
            throw new Error(`Invalid order settings, look at \n${errToThrow}`)
        })
};

const deleteOrder = async (id) => {
    return getJson(fetch(SERVER_URL + `/orders/${id}`, {
        method: 'DELETE',
        credentials: 'include',
    }))
        .then(

        )
        .catch(err => {
            //console.log(err);
            const errToThrow = err[0] ? err[0].path : err.message;
            throw new Error(`Invalid order settings, look at \n${errToThrow}`)
        })
};




async function getUserOrders(id) {
    return getJson(fetch(SERVER_URL + `/users/${id}/orders`, {
        method: 'GET',
        credentials: 'include',
    }))
}

async function logIn(credentials) {
    return getJson(fetch(SERVER_URL + '/login-local', {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    }))
}

async function logOut() {
    return getJson(fetch(SERVER_URL + '/login-local/current', {
        method: 'DELETE',
        credentials: 'include',
    }))
        .catch(err => {
            const errToThrow = err[0] ? err[0].message : err.message;
            throw new Error(`Errors during logout \n${errToThrow}`)
        })
}



function totpVerify(totpCode) {
    return getJson(fetch(SERVER_URL + `/login-totp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({code: totpCode}),
    }))
}


async function getUserInfo() {
    return getJson(fetch(SERVER_URL + '/login-local/current', {
        credentials: 'include'
    }));
}

export {getMenu, createOrder, deleteOrder, logIn, logOut, totpVerify, getUserInfo, getUserOrders};