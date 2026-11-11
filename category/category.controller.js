const categoryService = require('./category.service');
const { parseId } = require('../utils/validate');

module.exports = {
    list: async (req, res) => res.json(await categoryService.findAll()),
    findById: async (req, res) => res.json(await categoryService.findById(parseId(req.params.id))),
    create: async (req, res) => res.status(201).json(await categoryService.create(req.body || {})),
    update: async (req, res) => res.json(await categoryService.update(parseId(req.params.id), req.body || {})),
    remove: async (req, res) => {
        await categoryService.remove(parseId(req.params.id));
        res.status(204).end();
    }
};
