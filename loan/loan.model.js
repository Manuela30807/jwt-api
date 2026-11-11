const db = require('../config/db');
const { DataTypes } = require('sequelize');
const { daysLate, calcFine } = require('./loan.rules');

const Loan = db.define('Loan', {
    loanDate: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    },
    dueDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    returnDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ATIVO', 'DEVOLVIDO'),
        allowNull: false,
        defaultValue: 'ATIVO'
    },
    fine: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
    }
});

Loan.prototype.toJSON = function () {
    const data = { ...this.get({ plain: true }) };
    data.fine = Number(data.fine);
    if (!data.returnDate) {
        const late = daysLate(data.dueDate);
        if (late > 0) {
            data.status = 'ATRASADO';
            data.daysLate = late;
            data.currentFine = calcFine(data.dueDate); 
        }
    }
    return data;
};

module.exports = Loan;
