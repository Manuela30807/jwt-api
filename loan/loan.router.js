const { Router } = require('express');
const router = Router();

const controller = require('./loan.controller');
const authMiddleware = require('../auth/auth.middleware');

router.use(authMiddleware);

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.findById);
router.patch('/:id/return', controller.return);

module.exports = router;
