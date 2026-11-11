const readerService = require('./reader.service');
const { parseId } = require('../utils/validate');

module.exports = {
    list: async (req, res) => res.json(await readerService.findAll(req.query)),
    findById: async (req, res) => res.json(await readerService.findById(parseId(req.params.id))),
    create: async (req, res) => res.status(201).json(await readerService.create(req.body || {})),
    update: async (req, res) => res.json(await readerService.update(parseId(req.params.id), req.body || {})),
    loans: async (req, res) => res.json(await readerService.loans(parseId(req.params.id)))
};
