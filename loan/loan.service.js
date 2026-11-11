const { Op } = require('sequelize');
const { db, Loan, Book, Reader, User } = require('../models');
const { notFound, conflict, badRequest } = require('../utils/httpError');
const { requireFields, parseId } = require('../utils/validate');
const { MAX_ACTIVE_LOANS, calcDueDate, calcFine } = require('./loan.rules');

const include = [
    { model: Book, as: 'book', attributes: ['id', 'title', 'isbn'] },
    { model: Reader, as: 'reader', attributes: ['id', 'name', 'cpf'] },
    { model: User, as: 'attendant', attributes: ['id', 'name'] }
];

const STATUSES = ['ATIVO', 'ATRASADO', 'DEVOLVIDO'];

const loanService = {
    findAll: async (query = {}) => {
        const where = {};
        const now = new Date();

        if (query.status) {
            const status = String(query.status).toUpperCase();
            if (!STATUSES.includes(status)) {
                throw badRequest(`status inválido. Use: ${STATUSES.join(', ')}`);
            }
            if (status === 'DEVOLVIDO') where.returnDate = { [Op.not]: null };
            if (status === 'ATRASADO') { where.returnDate = null; where.dueDate = { [Op.lt]: now }; }
            if (status === 'ATIVO') { where.returnDate = null; where.dueDate = { [Op.gte]: now }; }
        }
        if (query.readerId) where.readerId = parseId(query.readerId, 'readerId');
        if (query.bookId) where.bookId = parseId(query.bookId, 'bookId');

        return Loan.findAll({ where, include, order: [['loanDate', 'DESC']] });
    },

    findById: async (id, transaction) => {
        const loan = await Loan.findByPk(id, { include, transaction });
        if (!loan) throw notFound('Empréstimo não encontrado');
        return loan;
    },

    create: async (data, userId) => {
        requireFields(data, ['bookId', 'readerId']);
        const bookId = parseId(data.bookId, 'bookId');
        const readerId = parseId(data.readerId, 'readerId');

        const loanId = await db.transaction(async (transaction) => {
            const book = await Book.findByPk(bookId, { transaction });
            if (!book) throw notFound('Livro não encontrado');
            const reader = await Reader.findByPk(readerId, { transaction });
            if (!reader) throw notFound('Leitor não encontrado');

            const now = new Date();

            const overdue = await Loan.count({
                where: { readerId, returnDate: null, dueDate: { [Op.lt]: now } },
                transaction
            });
            if (overdue > 0) {
                throw conflict('O leitor possui empréstimo(s) atrasado(s) e não pode pegar novos livros');
            }

            const active = await Loan.count({ where: { readerId, returnDate: null }, transaction });
            if (active >= MAX_ACTIVE_LOANS) {
                throw conflict(`O leitor já possui ${MAX_ACTIVE_LOANS} empréstimos ativos (limite máximo)`);
            }

            const [updated] = await Book.update(
                { availableCopies: db.literal('availableCopies - 1') },
                { where: { id: bookId, availableCopies: { [Op.gt]: 0 } }, transaction }
            );
            if (!updated) throw conflict('Não há exemplares disponíveis deste livro');

            const loan = await Loan.create({
                bookId,
                readerId,
                userId,
                loanDate: now,
                dueDate: calcDueDate(now),
                status: 'ATIVO',
                fine: 0
            }, { transaction });
            return loan.id;
        });

        return loanService.findById(loanId);
    },

    return: async (id) => {
        await db.transaction(async (transaction) => {
            const loan = await Loan.findByPk(id, { transaction });
            if (!loan) throw notFound('Empréstimo não encontrado');
            if (loan.returnDate) throw conflict('Este empréstimo já foi devolvido');

            const now = new Date();
            await loan.update({
                returnDate: now,
                status: 'DEVOLVIDO',
                fine: calcFine(loan.dueDate, now)
            }, { transaction });

            await Book.update(
                { availableCopies: db.literal('availableCopies + 1') },
                { where: { id: loan.bookId }, transaction }
            );
        });

        return loanService.findById(id);
    }
};

module.exports = loanService;
