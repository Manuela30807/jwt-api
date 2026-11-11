const dotenv = require('dotenv');
dotenv.config();

for (const name of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
    if (!process.env[name]) {
        console.error(`Variável de ambiente ${name} não definida. Copie .envex para .env e preencha.`);
        process.exit(1);
    }
}

const express = require('express');
const cors = require('cors');
const { db } = require('./models');
const seedAdmin = require('./config/seed');
const { notFoundHandler, errorHandler } = require('./utils/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3001').split(',').map((o) => o.trim()),
    credentials: true
}));
app.use(express.json());

app.use((req, res, next) => {
    res.on('finish', () => {
        const hora = new Date().toLocaleTimeString('pt-BR');
        console.log(`[${hora}] ${req.method} ${req.originalUrl} -> ${res.statusCode}`);
    });
    next();
});

app.use('/v1/auth', require('./auth/auth.router'));
app.use('/v1/user', require('./user/user.router'));
app.use('/v1/categories', require('./category/category.router'));
app.use('/v1/authors', require('./author/author.router'));
app.use('/v1/books', require('./book/book.router'));
app.use('/v1/readers', require('./reader/reader.router'));
app.use('/v1/loans', require('./loan/loan.router'));
app.use('/v1/reports', require('./report/report.router'));

app.use(notFoundHandler);
app.use(errorHandler);

(async () => {
    await db.sync();
    await seedAdmin();
    app.listen(PORT, () => {
        console.log(`SERVIDOR RODANDO http://localhost:${PORT}`);
    });
})().catch((err) => {
    console.error('Falha ao iniciar:', err);
    process.exit(1);
});
