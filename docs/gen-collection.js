const fs = require('fs');
const path = require('path');

const H = [{ key: 'Content-Type', value: 'application/json' }];
const bearer = { type: 'bearer', bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }] };

const req = (name, method, route, body, opts = {}) => {
    const [p, qs] = route.split('?');
    return {
        name,
        event: opts.test ? [{ listen: 'test', script: { type: 'text/javascript', exec: opts.test } }] : undefined,
        request: {
            method,
            header: body ? H : [],
            auth: opts.noAuth ? { type: 'noauth' } : undefined,
            url: {
                raw: `{{baseUrl}}${route}`,
                host: ['{{baseUrl}}'],
                path: p.split('/').filter(Boolean),
                query: qs ? qs.split('&').map((q) => ({ key: q.split('=')[0], value: q.split('=')[1] })) : undefined
            },
            body: body ? { mode: 'raw', raw: JSON.stringify(body, null, 2) } : undefined
        }
    };
};

const saveTokens = [
    'const r = pm.response.json();',
    'if (r.accessToken) {',
    '  pm.collectionVariables.set("accessToken", r.accessToken);',
    '  pm.collectionVariables.set("refreshToken", r.refreshToken);',
    '}'
];

const folder = (name, item) => ({ name, item });

const collection = {
    info: {
        name: 'Biblioteca API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: bearer,
    variable: [
        { key: 'baseUrl', value: 'http://localhost:3000/v1' },
        { key: 'accessToken', value: '' },
        { key: 'refreshToken', value: '' }
    ],
    item: [
        folder('Auth', [
            req('Login (admin do seed)', 'POST', '/auth/login', { email: 'admin@biblioteca.com', password: '123456' }, { noAuth: true, test: saveTokens }),
            req('Refresh (rotaciona o par)', 'POST', '/auth/refresh', { refreshToken: '{{refreshToken}}' }, { noAuth: true, test: saveTokens }),
            req('Me', 'GET', '/auth/me'),
            req('Logout', 'POST', '/auth/logout', { refreshToken: '{{refreshToken}}' }, { noAuth: true })
        ]),
        folder('Atendentes (admin)', [
            req('Listar', 'GET', '/user'),
            req('Criar atendente', 'POST', '/user', { name: 'Maria', username: 'maria', email: 'maria@biblioteca.com', password: '123456', isAdmin: false }),
            req('Editar', 'PUT', '/user/2', { name: 'Maria Silva' }),
            req('Desativar', 'PATCH', '/user/2/active', { active: false }),
            req('Ativar', 'PATCH', '/user/2/active', { active: true })
        ]),
        folder('Categorias', [
            req('Listar', 'GET', '/categories'),
            req('Criar (admin)', 'POST', '/categories', { name: 'Romance', description: 'Livros de romance' }),
            req('Editar (admin)', 'PUT', '/categories/1', { name: 'Romance', description: 'Atualizada' }),
            req('Excluir (admin)', 'DELETE', '/categories/1')
        ]),
        folder('Autores', [
            req('Listar', 'GET', '/authors'),
            req('Criar (admin)', 'POST', '/authors', { name: 'Machado de Assis', nationality: 'Brasileira', birthDate: '1839-06-21' }),
            req('Editar (admin)', 'PUT', '/authors/1', { nationality: 'Brasileiro' }),
            req('Excluir (admin)', 'DELETE', '/authors/1')
        ]),
        folder('Livros', [
            req('Listar com filtros', 'GET', '/books?title=dom&categoryId=1&authorId=1&available=true'),
            req('Criar (admin)', 'POST', '/books', { title: 'Dom Casmurro', isbn: '978-85-359-0277-5', year: 1899, totalCopies: 3, categoryId: 1, authorIds: [1] }),
            req('Editar (admin)', 'PUT', '/books/1', { totalCopies: 5 }),
            req('Excluir (admin)', 'DELETE', '/books/1')
        ]),
        folder('Leitores', [
            req('Listar', 'GET', '/readers?name=jo'),
            req('Criar', 'POST', '/readers', { name: 'João da Silva', cpf: '529.982.247-25', email: 'joao@email.com', phone: '45999999999' }),
            req('Editar', 'PUT', '/readers/1', { phone: '45988888888' }),
            req('Histórico', 'GET', '/readers/1/loans')
        ]),
        folder('Empréstimos', [
            req('Registrar empréstimo', 'POST', '/loans', { bookId: 1, readerId: 1 }),
            req('Listar por status', 'GET', '/loans?status=ATIVO'),
            req('Devolver', 'PATCH', '/loans/1/return')
        ]),
        folder('Relatórios', [req('Dashboard (admin)', 'GET', '/reports/dashboard')])
    ]
};

fs.writeFileSync(path.join(__dirname, '..', 'biblioteca.postman_collection.json'), JSON.stringify(collection, null, 2));
console.log('Coleção gerada: biblioteca.postman_collection.json');
