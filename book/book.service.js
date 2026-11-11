const { Op } = require('sequelize');
const { db, Book, BookAuthor, Category, Author, Loan } = require('../models');
const { notFound, conflict, badRequest } = require('../utils/httpError');
const {
    requireFields, pick, parseId, parseInteger, parseIdList, normalizeIsbn
} = require('../utils/validate');

const include = [
    { model: Category, as: 'category' },
    { model: Author, as: 'authors', through: { attributes: [] } }
];

async function assertCategoryAndAuthors(categoryId, authorIds) {
    if (categoryId !== undefined && !(await Category.findByPk(categoryId))) {
        throw notFound('Categoria não encontrada');
    }
    if (authorIds !== undefined) {
        if (authorIds.length === 0) throw badRequest('Informe pelo menos um autor');
        const found = await Author.count({ where: { id: { [Op.in]: authorIds } } });
        if (found !== authorIds.length) throw notFound('Um ou mais autores não foram encontrados');
    }
}

const bookService = {
    findAll: async (query = {}) => {
        const where = {};
        if (query.title) where.title = { [Op.like]: `%${query.title}%` };
        if (query.categoryId) where.categoryId = parseId(query.categoryId, 'categoryId');
        if (query.available === 'true') where.availableCopies = { [Op.gt]: 0 };
        if (query.available === 'false') where.availableCopies = 0;
        if (query.authorId) {
            const links = await BookAuthor.findAll({
                where: { authorId: parseId(query.authorId, 'authorId') },
                attributes: ['bookId']
            });
            where.id = { [Op.in]: links.map((l) => l.bookId) };
        }
        return Book.findAll({ where, include, order: [['title', 'ASC']] });
    },

    findById: async (id, transaction) => {
        const book = await Book.findByPk(id, { include, transaction });
        if (!book) throw notFound('Livro não encontrado');
        return book;
    },

    create: async (data) => {
        requireFields(data, ['title', 'isbn', 'categoryId', 'totalCopies']);
        const categoryId = parseId(data.categoryId, 'categoryId');
        const authorIds = parseIdList(data.authorIds, 'authorIds');
        const totalCopies = parseInteger(data.totalCopies, 'totalCopies', { min: 1 });
        await assertCategoryAndAuthors(categoryId, authorIds);

        const id = await db.transaction(async (transaction) => {
            const book = await Book.create({
                title: data.title,
                isbn: normalizeIsbn(data.isbn),
                year: data.year === undefined || data.year === '' || data.year === null
                    ? null : parseInteger(data.year, 'year', { min: 0 }),
                categoryId,
                totalCopies,
                availableCopies: totalCopies
            }, { transaction });
            await book.setAuthors(authorIds, { transaction });
            return book.id;
        });
        return bookService.findById(id);
    },

    update: async (id, data) => {
        const book = await bookService.findById(id);
        const fields = pick(data, ['title']);

        if (data.isbn !== undefined) fields.isbn = normalizeIsbn(data.isbn);
        if (data.year !== undefined) {
            fields.year = data.year === '' || data.year === null ? null : parseInteger(data.year, 'year', { min: 0 });
        }
        if (data.categoryId !== undefined) fields.categoryId = parseId(data.categoryId, 'categoryId');
        const authorIds = data.authorIds !== undefined ? parseIdList(data.authorIds, 'authorIds') : undefined;
        await assertCategoryAndAuthors(fields.categoryId, authorIds);

        if (data.totalCopies !== undefined) {
            const total = parseInteger(data.totalCopies, 'totalCopies', { min: 1 });
            const available = book.availableCopies + (total - book.totalCopies);
            if (available < 0) {
                throw conflict('O total de exemplares não pode ficar abaixo da quantidade atualmente emprestada');
            }
            fields.totalCopies = total;
            fields.availableCopies = available;
        }

        await db.transaction(async (transaction) => {
            await book.update(fields, { transaction });
            if (authorIds) await book.setAuthors(authorIds, { transaction });
        });
        return bookService.findById(id);
    },

    remove: async (id) => {
        const book = await bookService.findById(id);

        const open = await Loan.count({ where: { bookId: id, returnDate: null } });
        if (open > 0) {
            throw conflict(`Não é possível excluir: o livro possui ${open} empréstimo(s) ativo(s)`);
        }
        const history = await Loan.count({ where: { bookId: id } });
        if (history > 0) {
            throw conflict('Não é possível excluir: o livro possui histórico de empréstimos');
        }

        await db.transaction(async (transaction) => {
            await book.setAuthors([], { transaction });
            await book.destroy({ transaction });
        });
    }
};

module.exports = bookService;
