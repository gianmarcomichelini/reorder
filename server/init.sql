PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS ingredient_lines;
DROP TABLE IF EXISTS ingredients;
DROP TABLE IF EXISTS dishes;
DROP TABLE IF EXISTS sizes;
DROP TABLE IF EXISTS ingredient_dependencies;
DROP TABLE IF EXISTS ingredient_incompatibilities;

PRAGMA foreign_keys = ON;

-- Users
CREATE TABLE users
(
    user_id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_username   TEXT NOT NULL UNIQUE,
    user_email      TEXT NOT NULL UNIQUE,
    user_hashed_pwd TEXT NOT NULL,
    user_salt       TEXT NOT NULL,
    user_secret     TEXT
);

-- Dishes
CREATE TABLE dishes
(
    dish_id          INTEGER PRIMARY KEY AUTOINCREMENT,
    dish_name        TEXT NOT NULL UNIQUE,
    dish_description TEXT
);

-- Sizes
CREATE TABLE sizes
(
    size_id              INTEGER PRIMARY KEY AUTOINCREMENT,
    size_name            TEXT    NOT NULL UNIQUE,
    size_price           REAL    NOT NULL,
    size_max_ingredients INTEGER NOT NULL
);

-- Ingredients
CREATE TABLE ingredients
(
    ingredient_id             INTEGER PRIMARY KEY AUTOINCREMENT,
    ingredient_name           TEXT NOT NULL UNIQUE,
    ingredient_stock_quantity REAL NOT NULL DEFAULT 0,
    ingredient_price          REAL NOT NULL,
    ingredient_is_unlimited INTEGER NOT NULL DEFAULT 0
);

-- Orders (one dish per order)
CREATE TABLE orders
(
    order_id        INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INTEGER NOT NULL,
    dish_id         INTEGER NOT NULL,
    size_id         INTEGER NOT NULL,
    order_timestamp DATETIME DEFAULT (datetime('now', '+2 hour')),
    order_price     REAL    NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (user_id),
    FOREIGN KEY (dish_id) REFERENCES dishes (dish_id),
    FOREIGN KEY (size_id) REFERENCES sizes (size_id)
);

-- Ingredient Lines (many-to-many: order <-> ingredients)
CREATE TABLE ingredient_lines
(
    order_id      INTEGER NOT NULL,
    ingredient_id INTEGER NOT NULL,
    PRIMARY KEY (order_id, ingredient_id),
    FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    FOREIGN KEY (ingredient_id) REFERENCES ingredients (ingredient_id) ON DELETE CASCADE
);

-- Ingredient Dependencies (A requires B)
CREATE TABLE ingredient_dependencies
(
    ingredient_dependency_ingredient_id          INTEGER NOT NULL,
    ingredient_dependency_required_ingredient_id INTEGER NOT NULL,
    PRIMARY KEY (
                 ingredient_dependency_ingredient_id,
                 ingredient_dependency_required_ingredient_id
        ),
    FOREIGN KEY (ingredient_dependency_ingredient_id) REFERENCES ingredients (ingredient_id),
    FOREIGN KEY (ingredient_dependency_required_ingredient_id) REFERENCES ingredients (ingredient_id)
);

-- Ingredient Incompatibilities (A incompatible with B)
CREATE TABLE ingredient_incompatibilities
(
    ingredient_incompatibility_ingredient_id_1 INTEGER NOT NULL,
    ingredient_incompatibility_ingredient_id_2 INTEGER NOT NULL,
    PRIMARY KEY (
                 ingredient_incompatibility_ingredient_id_1,
                 ingredient_incompatibility_ingredient_id_2
        ),
    FOREIGN KEY (ingredient_incompatibility_ingredient_id_1) REFERENCES ingredients (ingredient_id),
    FOREIGN KEY (ingredient_incompatibility_ingredient_id_2) REFERENCES ingredients (ingredient_id)
);

---------

-- Sizes
INSERT INTO sizes (size_name, size_price, size_max_ingredients)
VALUES ('small', 5.0, 3),
       ('medium', 7.0, 5),
       ('large', 9.0, 7);

-- Base dishes
INSERT INTO dishes (dish_name, dish_description)
VALUES ('pizza', 'Delicious traditional pizza'),
       ('pasta', 'Freshly made pasta'),
       ('salad', 'Healthy green salad');

-- Ingredients
INSERT INTO ingredients (ingredient_name, ingredient_price, ingredient_stock_quantity, ingredient_is_unlimited)
VALUES ('mozzarella', 1.00, 3, 0),
       ('tomatoes', 0.50, 0, 1),
       ('mushrooms', 0.80, 3,0),
       ('ham', 1.20, 2,0),
       ('olives', 0.70, 0,1),
       ('tuna', 1.50, 2,0),
       ('eggs', 1.00, 0,1),
       ('anchovies', 1.50, 1,0),
       ('parmesan', 1.20, 0,1),
       ('carrots', 0.40, 0,1),
       ('potatoes', 0.30, 0,1);


-- Constraints - Incompatibilities

INSERT INTO ingredient_incompatibilities
VALUES ((SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'eggs'),
        (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'mushrooms'));
INSERT INTO ingredient_incompatibilities
VALUES ((SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'eggs'),
        (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'tomatoes'));
INSERT INTO ingredient_incompatibilities
VALUES ((SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'ham'),
        (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'mushrooms'));
INSERT INTO ingredient_incompatibilities
VALUES ((SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'olives'),
        (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'anchovies'));

-- Constraints - Dependencies
INSERT INTO ingredient_dependencies
VALUES ((SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'tomatoes'),
        (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'olives'));
INSERT INTO ingredient_dependencies
VALUES ((SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'parmesan'),
        (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'mozzarella'));
INSERT INTO ingredient_dependencies
VALUES ((SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'mozzarella'),
        (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'tomatoes'));
INSERT INTO ingredient_dependencies
VALUES ((SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'tuna'),
        (SELECT ingredient_id FROM ingredients WHERE ingredient_name = 'olives'));


-- Users
INSERT INTO users (user_username, user_email, user_hashed_pwd, user_salt, user_secret)
VALUES ('marco', 'u1@p.it', '61f930e26fc33f14d87a86efa26aa613d601e9681e9de5a31c6e9a83f4dd367a', 'AAAAAAAAAAAAAAAA',
        'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
       ('filippo', 'u2@p.it', '61f930e26fc33f14d87a86efa26aa613d601e9681e9de5a31c6e9a83f4dd367a', 'AAAAAAAAAAAAAAAA',
        'LXBSMDTMSP2I5XFXIYRGFVWSFI'),
       ('giangiacomo', 'u3@p.it', '61f930e26fc33f14d87a86efa26aa613d601e9681e9de5a31c6e9a83f4dd367a',
        'AAAAAAAAAAAAAAAA', ''),
       ('armando', 'u4@p.it', '61f930e26fc33f14d87a86efa26aa613d601e9681e9de5a31c6e9a83f4dd367a', 'AAAAAAAAAAAAAAAA',
        '');

-- Orders for user1: 2 small dishes with two ingredients only for the first order
INSERT INTO orders (user_id, order_id, order_price, dish_id, size_id)
VALUES (1, 1, 5.7, 1, 1),
       (1, 2, 5, 1, 1);

INSERT INTO ingredient_lines
VALUES (1, 10),
       (1, 11);


-- Orders for user2: 1 medium + 1 large
INSERT INTO orders (user_id, order_id, order_price, dish_id, size_id)
VALUES (2, 3, 7, 2, 2),
       (2, 4, 9, 3, 3);

