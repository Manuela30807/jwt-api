const { Op } = require('sequelize');
const { Reader, Loan, Book } = require('../models');
const { notFound, badRequest } = require('../utils/httpError');
const { requireFields, pick, onlyDigits, isValidCpf } = require('../utils/validate');

function clean(data) {
    const fields = pick(data, ['name', 'email', 'phone']);
    if (data.email === '') fields.email = null;
    if (data.cpf !== undefined) {
        if (!isValidCpf(data.cpf)) throw badRequest('CPF inválido');
        fields.cpf = onlyDigits(data.cpf);
    }
    return fields;
}

const readerService = {
    findAll: async (query = {}) => {
        const where = {};
        if (query.name) where.name = { [Op.like]: `%${query.name}%` };
        if (query.cpf) where.cpf = { [Op.like]: `%${onlyDigits(query.cpf)}%` };
        return Reader.findAll({ where, order: [['name', 'ASC']] });
    },

    findById: async (id) => {
        const reader = await Reader.findByPk(id);
        if (!reader) throw notFound('Leitor não encontrado');
        return reader;
    },

    create: async (data) => {
        requireFields(data, ['name', 'cpf']);
        return Reader.create(clean(data));
    },

    update: async (id, data) => {
        const reader = await readerService.findById(id);
        return reader.update(clean(data));
    },

    loans: async (id) => {
        await readerService.findById(id);
        return Loan.findAll({
            where: { readerId: id },
            include: [{ model: Book, as: 'book', attributes: ['id', 'title', 'isbn'] }],
            order: [['loanDate', 'DESC']]
        });
    }
};

module.exports = readerService;
