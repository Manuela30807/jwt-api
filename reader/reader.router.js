const { Router } = require('express');
const router = Router();

const controller = require('./reader.controller');
const authMiddleware = require('../auth/auth.middleware');

router.use(authMiddleware);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.findById);
router.put('/:id', controller.update);
router.get('/:id/loans', controller.loans);

module.exports = router;
