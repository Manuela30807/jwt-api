const userService = require('./user.service');
const { parseId } = require('../utils/validate');

const userController = {
    create: async (req, res) => {
        res.status(201).json(await userService.create(req.body || {}));
    },
    findById: async (req, res) => {
        res.json(await userService.findById(parseId(req.params.id)));
    },
    findByEmail: async (req, res) => {
        res.json(await userService.findByEmail(req.params.email));
    },
    findAll: async (req, res) => {
        res.json(await userService.findAll());
    },
    update: async (req, res) => {
        res.json(await userService.update(parseId(req.params.id), req.body || {}, req.user.id));
    },
    setActive: async (req, res) => {
        res.json(await userService.setActive(parseId(req.params.id), req.body?.active, req.user.id));
    }
};

module.exports = userController;
