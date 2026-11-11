const { Router } = require('express');
const router = Router();

const reportService = require('./report.service');
const authMiddleware = require('../auth/auth.middleware');
const isAdmin = require('../auth/admin.middleware');

router.get('/dashboard', authMiddleware, isAdmin, async (req, res) => {
    res.json(await reportService.dashboard());
});

module.exports = router;
