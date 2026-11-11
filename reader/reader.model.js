const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Reader = db.define('Reader', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: 'Nome do leitor é obrigatório' } }
    },
    cpf: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: { msg: 'E-mail inválido' } }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    }
});

module.exports = Reader;
