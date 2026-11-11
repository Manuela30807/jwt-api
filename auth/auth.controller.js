const authService = require('./auth.service');

const authController = {
    async login(req, res) {
        const { email, password } = req.body || {};
        res.json(await authService.login(email, password));
    },

    async refresh(req, res) {
        res.json(await authService.refresh(req.body?.refreshToken));
    },

    async logout(req, res) {
        await authService.logout(req.body?.refreshToken);
        res.json({ message: 'Logout realizado com sucesso' });
    },

    async me(req, res) {
        res.json(authService.publicUser(req.user));
    }
};

module.exports = authController;
