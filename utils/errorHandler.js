const { HttpError } = require('./httpError');

const FIELD_LABELS = {
    cpf: 'CPF',
    email: 'e-mail',
    isbn: 'ISBN',
    username: 'usuário',
    name: 'nome'
};

const notFoundHandler =(req, res) => {
    res.status(404).json({ error: 'Rota não encontrada' });
};

const errorHandler = (err, req, res, next) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({ error: err.message });
    }
    if (err.type === 'entity.parse.failed') {
        return res.status(400).json({ error: 'JSON inválido no corpo da requisição' });
    }
    switch (err.name) {
        case 'SequelizeUniqueConstraintError': {
            const fromErrors = (err.errors || []).map((e) => e.path).filter(Boolean);
            const fromFields = Array.isArray(err.fields) ? err.fields : Object.keys(err.fields || {});
            const names = [...new Set(fromErrors.length ? fromErrors : fromFields)]
                .filter((f) => Number.isNaN(Number(f)));
            const parts = names.map((f) => {
                const value = req.body && typeof req.body[f] === 'string' ? req.body[f] : null;
                return `${FIELD_LABELS[f] || f}${value ? ` "${value}"` : ''}`;
            });
            return res.status(409).json({
                error: parts.length
                    ? `Já existe um registro com este valor: ${parts.join(', ')}`
                    : 'Já existe um registro com os mesmos dados'
            });
        }
        case 'SequelizeValidationError':
            return res.status(400).json({ error: err.errors.map((e) => e.message).join('; ') });
        case 'SequelizeForeignKeyConstraintError':
            return res.status(409).json({ error: 'Operação bloqueada: existem registros vinculados' });
    }
    console.error(err);
    res.status(500).json({ error: 'Erro interno do servidor' });
};

module.exports = { notFoundHandler, errorHandler };
