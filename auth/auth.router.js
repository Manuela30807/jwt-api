const { Router } = require('express');
const router = Router();

const authController = require('./auth.controller');
const authMiddleware = require('./auth.middleware');

router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;
