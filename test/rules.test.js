const test = require('node:test');
const assert = require('node:assert');
const { calcDueDate, daysLate, calcFine, DAY_MS } = require('../loan/loan.rules');
const { isValidCpf, normalizeIsbn } = require('../utils/validate');

test('prazo padrão de 7 dias', () => {
    const d = new Date('2026-10-01T10:00:00Z');
    assert.strictEqual(calcDueDate(d).getTime() - d.getTime(), 7 * DAY_MS);
});

test('multa de R$1 por dia de atraso', () => {
    const due = new Date('2026-10-08T10:00:00Z');
    assert.strictEqual(calcFine(due, new Date('2026-10-08T09:00:00Z')), 0);
    assert.strictEqual(calcFine(due, new Date('2026-10-08T11:00:00Z')), 1);
    assert.strictEqual(calcFine(due, new Date('2026-10-11T10:00:00Z')), 3);
    assert.strictEqual(daysLate(due, new Date('2026-10-11T10:00:01Z')), 4);
});

test('validação de CPF', () => {
    assert.ok(isValidCpf('529.982.247-25'));
    assert.ok(!isValidCpf('111.111.111-11'));
    assert.ok(!isValidCpf('529.982.247-24'));
});

test('normalização de ISBN', () => {
    assert.strictEqual(normalizeIsbn('978-85-359-0277-5'), '9788535902775');
    assert.throws(() => normalizeIsbn('123'));
});
