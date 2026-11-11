const bcrypt = require('bcrypt');
const { User } = require('../models');
const authService = require('../auth/auth.service');
const { notFound, badRequest } = require('../utils/httpError');
const { requireFields, pick } = require('../utils/validate');

const MIN_PASSWORD = 6;

function checkPassword(password) {
    if (typeof password !== 'string' || password.length < MIN_PASSWORD) {
        throw badRequest(`A senha deve ter pelo menos ${MIN_PASSWORD} caracteres`);
    }
}

const userService = {
    create: async (data) => {
        requireFields(data, ['name', 'username', 'email', 'password']);
        checkPassword(data.password);

        const user = await User.create({
            ...pick(data, ['name', 'username', 'email']),
            password: await bcrypt.hash(data.password, 10),
            isAdmin: data.isAdmin === true,
            active: true
        });
        return User.findByPk(user.id);
    },

    findById: async (id) => {
        const user = await User.findByPk(id);
        if (!user) throw notFound('Usuário não encontrado');
        return user;
    },

    findByEmail: async (email) => {
        const user = await User.findOne({ where: { email } });
        if (!user) throw notFound('Usuário não encontrado');
        return user;
    },

    findAll: async () => User.findAll({ order: [['name', 'ASC']] }),

    update: async (id, data, currentUserId) => {
        const user = await userService.findById(id);
        const fields = pick(data, ['name', 'username', 'email']);

        if (data.isAdmin !== undefined) {
            if (user.id === currentUserId && data.isAdmin !== true) {
                throw badRequest('Você não pode remover seu próprio perfil de administrador');
            }
            fields.isAdmin = data.isAdmin === true;
        }
        if (data.password !== undefined && data.password !== '') {
            checkPassword(data.password);
            fields.password = await bcrypt.hash(data.password, 10);
        }

        await user.update(fields);
        return userService.findById(id);
    },

    setActive: async (id, active, currentUserId) => {
        if (typeof active !== 'boolean') throw badRequest('O campo "active" deve ser true ou false');
        const user = await userService.findById(id);

        if (!active && user.id === currentUserId) {
            throw badRequest('Você não pode desativar a si mesmo');
        }

        await user.update({ active });
        if (!active) await authService.revokeAllFromUser(user.id);
        return user;
    }
};

module.exports = userService;
