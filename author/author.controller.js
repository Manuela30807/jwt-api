const authorService = require('./author.service');
const { parseId } = require('../utils/validate');

module.exports = {
    list: async (req, res) => res.json(await authorService.findAll()),
    findById: async (req, res) => res.json(await authorService.findById(parseId(req.params.id))),
    create: async (req, res) => res.status(201).json(await authorService.create(req.body || {})),
    update: async (req, res) => res.json(await authorService.update(parseId(req.params.id), req.body || {})),
    remove: async (req, res) => {
        await authorService.remove(parseId(req.params.id));
        res.status(204).end();
    }
};
