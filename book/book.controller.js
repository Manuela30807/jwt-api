const bookService = require('./book.service');
const { parseId } = require('../utils/validate');

module.exports = {
    list: async (req, res) => res.json(await bookService.findAll(req.query)),
    findById: async (req, res) => res.json(await bookService.findById(parseId(req.params.id))),
    create: async (req, res) => res.status(201).json(await bookService.create(req.body || {})),
    update: async (req, res) => res.json(await bookService.update(parseId(req.params.id), req.body || {})),
    remove: async (req, res) => {
        await bookService.remove(parseId(req.params.id));
        res.status(204).end();
    }
};
