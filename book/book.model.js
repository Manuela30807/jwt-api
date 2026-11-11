const db = require('../config/db');
const { DataTypes } = require('sequelize');

const Book = db.define('Book', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: { notEmpty: { msg: 'Título é obrigatório' } }
    },
    isbn: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    totalCopies: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 0 }
    },
    availableCopies: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: { min: 0 }
    }
});

const BookAuthor = db.define('BookAuthor', {}, { timestamps: false });

module.exports = { Book, BookAuthor };
