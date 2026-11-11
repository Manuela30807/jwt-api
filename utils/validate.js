const { badRequest } = require('./httpError');

function isBlank(value) {
    return value === undefined || value === null || String(value).trim() === '';
}

function requireFields(body, fields) {
    const data = body || {};
    const missing = fields.filter((f) => isBlank(data[f]));
    if (missing.length) {
        throw badRequest(`Campos obrigatórios não informados: ${missing.join(', ')}`);
    }
}

function pick(obj, keys) {
    const out = {};
    for (const k of keys) {
        if (obj && obj[k] !== undefined) out[k] = obj[k];
    }
    return out;
}

function parseId(value, name = 'id') {
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) throw badRequest(`${name} inválido`);
    return n;
}

function parseInteger(value, name, { min } = {}) {
    const n = Number(value);
    if (value === '' || value === null || !Number.isInteger(n)) {
        throw badRequest(`${name} deve ser um número inteiro`);
    }
    if (min !== undefined && n < min) throw badRequest(`${name} deve ser maior ou igual a ${min}`);
    return n;
}

function parseIdList(value, name) {
    if (!Array.isArray(value)) throw badRequest(`${name} deve ser uma lista de ids`);
    const ids = [...new Set(value.map((v) => parseId(v, name)))];
    return ids;
}

function onlyDigits(value) {
    return String(value ?? '').replace(/\D/g, '');
}

function isValidCpf(value) {
    const cpf = onlyDigits(value);
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    const digit = (len) => {
        let sum = 0;
        for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
        const r = (sum * 10) % 11;
        return r === 10 ? 0 : r;
    };
    return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10]);
}

function normalizeIsbn(value) {
    const isbn = String(value ?? '').replace(/[\s-]/g, '').toUpperCase();
    if (!/^(\d{9}[\dX]|\d{13})$/.test(isbn)) {
        throw badRequest('ISBN inválido (use 10 ou 13 dígitos)');
    }
    return isbn;
}

function parseDateOnly(value, name) {
    if (isBlank(value)) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value)) || Number.isNaN(Date.parse(value))) {
        throw badRequest(`${name} deve estar no formato AAAA-MM-DD`);
    }
    return String(value);
}

module.exports = {
    isBlank,
    requireFields,
    pick,
    parseId,
    parseInteger,
    parseIdList,
    onlyDigits,
    isValidCpf,
    normalizeIsbn,
    parseDateOnly
};
