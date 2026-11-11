const { Router } = require('express');
const router = Router();

const controller = require('./category.controller');
const authMiddleware = require('../auth/auth.middleware');
const isAdmin = require('../auth/admin.middleware');

router.use(authMiddleware);

router.get('/', controller.list);
router.get('/:id', controller.findById);
router.post('/', isAdmin, controller.create);
router.put('/:id', isAdmin, controller.update);
router.delete('/:id', isAdmin, controller.remove);

module.exports = router;
