const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Author = db.define('Author', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: 'Nome do autor é obrigatório' } }
    },
    nationality: {
        type: DataTypes.STRING,
        allowNull: true
    },
    birthDate: {
        type: DataTypes.DATEONLY,
        allowNull: true
    }
});

module.exports = Author;
