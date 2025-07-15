'use strict'

const {test, assert} = require('../test')
const {getUserById, getUser} = require("../../dao/dao-users");

test('getUserById returns correct user', () => {
    getUserById(1).then(
        (user) => {
            const expectedUser = {
                id: 1,
                email: 'u1@p.it',
                name: 'marco',
                secret: 'LXBSMDTMSP2I5XFXIYRGFVWSFI',
            };

            //console.log(user);
            //console.log(expectedUser);

            assert.deepStrictEqual(user, expectedUser);
        })
        .catch((err) => console.log(err))

});

test('getUser returns correct user with authentication', () => {
    getUser('u1@p.it', 'pwd')
        .then((user) => (user) => {
            const expectedUser = {
                id: 1,
                email: 'u1@p.it',
                name: 'marco',
                secret: 'LXBSMDTMSP2I5XFXIYRGFVWSFI',
            };

            //console.log(user);
            //console.log(expectedUser);

            assert.deepStrictEqual(user, expectedUser);
        })
        .catch((err) => console.log(err))
});