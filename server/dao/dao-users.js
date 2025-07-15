const crypto = require('crypto');
const db = require('./db');

/**
 * Retrieves a user by ID.
 * @param {number} id - The user's ID.
 * @returns {Promise<Object>} Resolves with user object or rejects with an error.
 */
function getUserById(id) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE user_id = ?';
        db.get(sql, [id], (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('User not found in the database.'));

            resolve({
                id: row.user_id,
                email: row.user_email,
                name: row.user_username,
                secret: row.user_secret || null
            });
        });
    });
}

/**
 * Retrieves and validates a user by email and password.
 * @param {string} email - The user's email.
 * @param {string} password - The user's plaintext password.
 * @returns {Promise<Object>} Resolves with user object or rejects with an error.
 */
function getUser(email, password) {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM users WHERE user_email = ?';
        db.get(sql, [email], (err, row) => {
            if (err) return reject(err);
            if (!row) return reject(new Error('User not found in the database.'));

            const user = {
                id: row.user_id,
                email: row.user_email,
                name: row.user_username,
                secret: row.user_secret || null
            };

            const salt = row.user_salt;
            const hashedPasswordFromDB = Buffer.from(row.user_hashed_pwd, 'hex');

            crypto.scrypt(password, salt, 32, (err, derivedKey) => {
                if (err) return reject(err);
                if (!crypto.timingSafeEqual(hashedPasswordFromDB, derivedKey)) {
                    return reject(new Error(`Password not valid for user: ${user.name}`));
                }

                resolve(user);
            });
        });
    });
}

module.exports = {
    getUser,
    getUserById
};