const authService = require('./auth.service');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
    const [scheme, token] = (req.header('Authorization') || '').split(' ');

    if (scheme !== 'Bearer' || !token) {
        return res.status(401).json({ error: 'Acesso negado. Token não informado.', code: 'NO_TOKEN' });
    }

    let user;
    try {
        const decoded = authService.verifyAccessToken(token);

        user = await User.findByPk(decoded.id);
    } catch (error) {
        const expired = error.name === 'TokenExpiredError';
        return res.status(401).json({
            error: expired ? 'Token expirado.' : 'Token inválido.',
            code: expired ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN'
        });
    }

    if (!user || !user.active) {
        return res.status(401).json({ error: 'Usuário inexistente ou desativado.', code: 'INVALID_TOKEN' });
    }

    req.user = user;
    next();
};

module.exports = authMiddleware;
