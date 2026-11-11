const loanService = require('./loan.service');
const { parseId } = require('../utils/validate');

module.exports = {
    list: async (req, res) => res.json(await loanService.findAll(req.query)),
    findById: async (req, res) => res.json(await loanService.findById(parseId(req.params.id))),
    create: async (req, res) => res.status(201).json(await loanService.create(req.body || {}, req.user.id)),
    return: async (req, res) => res.json(await loanService.return(parseId(req.params.id)))
};
