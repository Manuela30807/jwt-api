const { Op } = require('sequelize');
const { Book, Loan } = require('../models');
const { calcFine } = require('../loan/loan.rules');

const reportService = {
    dashboard: async () => {
        const now = new Date();

        const [totalBooks, totalCopies, availableCopies, activeLoans, overdueLoans, paidFines, overdueList] =
            await Promise.all([
                Book.count(),
                Book.sum('totalCopies'),
                Book.sum('availableCopies'),
                Loan.count({ where: { returnDate: null, dueDate: { [Op.gte]: now } } }),
                Loan.count({ where: { returnDate: null, dueDate: { [Op.lt]: now } } }),
                Loan.sum('fine', { where: { returnDate: { [Op.not]: null } } }),
                Loan.findAll({ where: { returnDate: null, dueDate: { [Op.lt]: now } }, attributes: ['dueDate'] })
            ]);

        const pendingFines = overdueList.reduce((sum, l) => sum + calcFine(l.dueDate, now), 0);
        const round = (n) => Math.round((Number(n) || 0) * 100) / 100;

        return {
            totalBooks,
            totalCopies: totalCopies || 0,
            availableCopies: availableCopies || 0,
            borrowedCopies: activeLoans + overdueLoans,
            activeLoans,
            overdueLoans,
            totalFines: round(paidFines),    
            pendingFines: round(pendingFines) 
        };
    }
};

module.exports = reportService;
