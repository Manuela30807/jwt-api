const bcrypt = require('bcrypt');
const { User } = require('../models');

async function seedAdmin() {
    if (await User.count({ where: { isAdmin: true } })) return;

    const email = process.env.ADMIN_EMAIL || 'admin@biblioteca.com';
    const password = process.env.ADMIN_PASSWORD || '123456';

    await User.create({
        name: process.env.ADMIN_NAME || 'Administrador',
        username: process.env.ADMIN_USERNAME || 'admin',
        email,
        password: await bcrypt.hash(password, 10),
        isAdmin: true,
        active: true
    });
    console.log(`Admin criado pelo seed: ${email}`);
}

module.exports = seedAdmin;
