const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { db, User, RefreshToken } = require('../models');
const { unauthorized, forbidden, badRequest } = require('../utils/httpError');

const REFRESH_EXPIRES_IN = '7d';

const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');

const publicUser = (user) => ({
    id: user.id,
    name: user.name,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin
});

function signAccessToken(user) {
    return jwt.sign(
        { id: user.id, name: user.name, email: user.email, isAdmin: user.isAdmin },
        process.env.JWT_SECRET,
        { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m' }
    );
}

function signRefreshToken(user) {
    return jwt.sign(
        { id: user.id, jti: crypto.randomUUID() },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

async function issueTokens(user, transaction) {
    const accessToken = signAccessToken(user);
    const refreshToken = signRefreshToken(user);
    const { exp } = jwt.decode(refreshToken);

    await RefreshToken.create(
        { token: sha256(refreshToken), userId: user.id, expiresAt: new Date(exp * 1000) },
        { transaction }
    );

    return { accessToken, refreshToken, user: publicUser(user) };
}

const authService = {
    login: async (email, password) => {
        if (!email || !password) throw badRequest('E-mail e senha são obrigatórios');

        const user = await User.scope('withPassword').findOne({ where: { email } });
        if (!user) throw unauthorized('E-mail ou senha inválidos');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw unauthorized('E-mail ou senha inválidos');

        if (!user.active) throw forbidden('Usuário desativado. Procure um administrador.');

        return issueTokens(user);
    },

    refresh: async (refreshToken) => {
        if (!refreshToken || typeof refreshToken !== 'string') {
            throw badRequest('refreshToken é obrigatório');
        }

        try {
            jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (err) {
            throw unauthorized('Refresh token inválido ou expirado');
        }

        const record = await RefreshToken.findOne({ where: { token: sha256(refreshToken) } });
        if (!record) throw unauthorized('Refresh token inválido');

        if (record.revoked) {
            await RefreshToken.update({ revoked: true }, { where: { userId: record.userId, revoked: false } });
            throw unauthorized('Refresh token reutilizado. Todas as sessões foram encerradas.');
        }

        if (record.expiresAt.getTime() < Date.now()) {
            throw unauthorized('Refresh token expirado');
        }

        const user = await User.findByPk(record.userId);
        if (!user || !user.active) throw unauthorized('Usuário inexistente ou desativado');

        return db.transaction(async (transaction) => {
            const [affected] = await RefreshToken.update(
                { revoked: true },
                { where: { id: record.id, revoked: false }, transaction }
            );
            if (!affected) throw unauthorized('Refresh token inválido');
            return issueTokens(user, transaction);
        });
    },

    logout: async (refreshToken) => {
        if (!refreshToken || typeof refreshToken !== 'string') {
            throw badRequest('refreshToken é obrigatório');
        }
        await RefreshToken.update({ revoked: true }, { where: { token: sha256(refreshToken) } });
    },

    verifyAccessToken: (token) => jwt.verify(token, process.env.JWT_SECRET),

    revokeAllFromUser: (userId) =>
        RefreshToken.update({ revoked: true }, { where: { userId, revoked: false } }),

    publicUser
};

module.exports = authService;
