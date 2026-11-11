const db = require('../config/db');
const { DataTypes } = require('sequelize');

const User = db.define('User', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: 'Nome é obrigatório' } }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: { msg: 'E-mail inválido' } }
    },
    isAdmin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { notEmpty: { msg: 'Username é obrigatório' } }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    defaultScope: { attributes: { exclude: ['password'] } },
    scopes: { withPassword: {} }
});

module.exports = User;
