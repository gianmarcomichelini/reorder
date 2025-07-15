'use strict';

// init express
const express = require('express');
const app = new express();
const port = 3001;
app.use(express.json());    // To automatically decode incoming json


const {check, validationResult, body} = require('express-validator'); // validation middleware
// This function is used to format express-validator errors as strings
const errorFormatter = ({location, msg, param, value, nestedErrors}) => {
    return {message: msg};
};

const morgan = require('morgan');  // logging middleware
app.use(morgan('dev'));


const cors = require('cors');
const corsOptions = {
    origin: ['http://localhost:5173'],
    credentials: true,
};
app.use(cors(corsOptions));


/* authentication */
const userDAO = require('./dao/dao-users')

const passport = require('passport'); // auth middleware

const LocalStrategy = require('passport-local'); // username and password for login
const session = require('express-session'); // enable sessions

// set up the "username and password" login strategy
// by setting a function to verify username and password
passport.use(new LocalStrategy(
    function (username, password, done) {
        userDAO.getUser(username, password)
            .then(user => done(null, user))
            .catch(err => done(null, false, {message: err.message}));
    }
));

// custom middleware: check if a given request is coming from an authenticated user
const isLoggedIn = (req, res, next) => {
    if (req.isAuthenticated())
        return next();
    return res.status(401).json({message: 'User Not authenticated'});
}

// serialize and de-serialize the user (user object <-> session)

// what is serialized is stored in the session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// starting from the data in the session (the id) is extracted the user (if any)
passport.deserializeUser((id, done) => {
    userDAO.getUserById(id)
        .then(user => {
            done(null, user); // this will be available in req.user
        }).catch(err => {
        done(err, null);
    });
});

const base32 = require('thirty-two');
const TotpStrategy = require('passport-totp').Strategy; // totp

passport.use(new TotpStrategy(
    function (user, done) {
        //console.log(user)
        // In case .secret does not exist, decode() will return an empty buffer
        // console.log("User secret: ", user.secret);
        if (!user.secret) return done(null, false, {message: "User cannot authenticate with TOTP"});
        return done(null, base32.decode(user.secret), 30);  // 30 = period of key validity
    })
);

// custom middleware: check if a given request is coming from an authenticated user with TOTP
function isLoggedWithTotp(req, res, next) {
    if (req.session.method === 'totp')
        return next();
    return res.status(401).json({message: 'Missing TOTP authentication'});
}


// set up the session
app.use(session({
    // by default, Passport uses a MemoryStore to keep track of the sessions
    secret: 'z8mKf2WnX9qLp3DyRT',   // change this random string, should be a secret value
    resave: false,  //Pprevents the session from being saved back to the session store if it wasn’t modified during the request
    saveUninitialized: false    // don't save sessions without data
}));

// then, init passport
app.use(passport.initialize());
app.use(passport.session());


/*** User APIs ***/

app.post('/api/login-local', function (req, res, next) {
    passport.authenticate('local', (err, user, info) => {
        if (err)
            return next(err);
        if (!user) {
            // display wrong login messages
            //console.log(info)
            return res.status(401).json({message: 'Wrong credentials, please try again'});
        }
        // success, perform the login
        req.login(user, (err) => {
            if (err)
                return next(err);

            //console.log(req.user);

            return res.status(200).json({name: req.user.name});
        });
    })(req, res, next);
});

app.delete('/api/login-local/current', (req, res) => {
    req.logout(() => res.status(200).json({message: `Logged out`}));
});

function clientUserInfo(req) {
    const user = req.user;
    //console.log(JSON.stringify(req.user));
    return {
        id: user.id,
        name: user.name,
        canDoTotp: user.secret ? true : false,
        isTotp: req.session.method === 'totp'
    };
}

// to obtain information about the current authenticated session
app.get('/api/login-local/current', (req, res) => {
    if (req.isAuthenticated()) {
        res.status(200).json(clientUserInfo(req));
    } else {
        res.status(200).json({message: 'Unauthenticated user!'});
    }
});

app.post('/api/login-totp', isLoggedIn, function (req, res, next) {
    passport.authenticate('totp', function (err, user) {
        if (err)
            return next(err);
        if (!user) {
            const errorMessage = "TOTP authentication failed. Make sure you have a TOTP secret configured or provided a valid code.";
            //console.log("Info on totp login:", info);
            return res.status(401).json({message: errorMessage});
        }

        req.session.method = 'totp';
        return res.status(200).json({message: 'TOTP verified successfully'});
    })(req, res, next);
});


/*** Order APIs ***/
const orderDAO = require('./dao/dao-orders')


function handleOrderError(err, res) {
    const clientErrors = [
        'exceeds max ingredient limit',
        'Invalid',
        'Insufficient',
        'Missing',
        'Incompatibility',
        'Duplicate',
        'not found'
    ];

    if (clientErrors.some(msg => err.message.includes(msg))) {
        res.status(422).json({message: err.message});
    } else {
        console.error(err);
        res.status(500).json({message: 'Internal Server Error'});
    }
}


app.get('/api/menu', async (req, res) => {

    try {
        const [ingredients, sizes, dishes, incompatibilities, dependencies] = await Promise.all([
            orderDAO.getIngredients(),
            orderDAO.getSizes(),
            orderDAO.getDishes(),
            orderDAO.getIncompatibilities(),
            orderDAO.getDependencies()
        ]);

        res.json({
            ingredients,
            sizes,
            dishes,
            incompatibilities,
            dependencies
        });
    } catch (err) {
        handleOrderError(err, res);
    }
});


app.get('/api/users/:userId/orders', isLoggedIn,
    [check('userId').isInt({min: 1}).withMessage('User ID must be a positive integer')],
    async (req, res) => {
        // Is there any validation error?
        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.errors);
        }
        orderDAO.getOrders({userId: req.user.id})
            .then(listOfOrders => res.json(listOfOrders))
            .catch(err => handleOrderError(err, res));
    });
/*
// API for admins to get info on a specific order in the db
app.get('/api/orders/:orderId',
    [check('orderId').isInt({min: 1}).withMessage('Order ID must be a positive integer')],
    async (req, res) => {
        // Is there any validation error?
        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.errors);
        }
        orderDAO.getOrders({orderId: req.params.orderId})
            .then(order => res.json(order))
            .catch(err => handleOrderError(err, res));
    }
);
*/

/*
// API for admins to get info on all orders in the db
app.get('/api/orders',
    async (req, res) => {
        // Is there any validation error?
        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.errors);
        }
        orderDAO.getOrders()
            .then(order => res.json(order))
            .catch(err => handleOrderError(err, res));
    }
);
*/

const allowedOrderFields = ['dish_name', 'size_name', 'ingredients'];
const allowedIngredientFields = ['ingredient_name'];

function checkUnexpectedFields(req, res, next) {
    // Check top-level fields
    const keys = Object.keys(req.body);
    for (const key of keys) {
        if (!allowedOrderFields.includes(key)) {
            return res.status(422).json({message: `Unexpected field '${key}' in request body`});
        }
    }

    // Check fields inside each ingredient object
    if (Array.isArray(req.body.ingredients)) {
        for (const ing of req.body.ingredients) {
            const ingKeys = Object.keys(ing);
            for (const k of ingKeys) {
                if (!allowedIngredientFields.includes(k)) {
                    return res.status(422).json({message: `Unexpected field '${k}' in ingredient object \n (maybe there are no keys for the ingredient object)`});
                }
            }
        }
    }

    next();
}

app.post('/api/orders', isLoggedIn,
    [
        body('dish_name').isString().notEmpty(),
        body('size_name').isString().notEmpty(),
        body('ingredients.*.ingredient_name').isString().notEmpty(),
        checkUnexpectedFields,
    ],
    (req, res) => {
        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.errors);
        }


        const orderPayload = {
            dish_name: req.body.dish_name,
            size_name: req.body.size_name,
            ingredients: req.body.ingredients.map(ing => ({
                ingredient_name: ing.ingredient_name
            }))
        };

        //console.log('Order Payload:', orderPayload);

        orderDAO.createOrder(req.user?.id, orderPayload)
            .then(orderId => {
                res.status(201).json({
                    orderId,
                    message: 'Order validated and created successfully'
                });
            })
            .catch(err => handleOrderError(err, res));
    }
);

app.delete('/api/orders/:orderId', isLoggedIn, isLoggedWithTotp,
    [check('orderId').isInt({min: 1}).withMessage('Order ID must be a positive integer')],
    async (req, res) => {
        // Is there any validation error?
        const errors = validationResult(req).formatWith(errorFormatter);
        if (!errors.isEmpty()) {
            return res.status(422).json(errors.errors);
        }


        orderDAO.deleteOrder(Number(req.params.orderId), req.user?.id)
            .then(orderId => {
                res.status(201).json({
                    orderId,
                    message: `Order deleted successfully`
                });
            })
            .catch(err => handleOrderError(err, res));
    }
);

// default route
app.use((req, res) => {
    res.status(404).json([{message: 'Route Not Found'}]);
});


// activate the server
app.listen(port, (err) => {
    if (err) console.log(err); else console.log(`Server listening at http://localhost:${port}`);
});