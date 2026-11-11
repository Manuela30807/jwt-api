const { Author, BookAuthor } = require('../models');
const { notFound, conflict } = require('../utils/httpError');
const { requireFields, pick, parseDateOnly } = require('../utils/validate');

function clean(data) {
    const fields = pick(data, ['name', 'nationality', 'birthDate']);
    if (data.birthDate !== undefined) fields.birthDate = parseDateOnly(data.birthDate, 'birthDate');
    return fields;
}

const authorService = {
    findAll: () => Author.findAll({ order: [['name', 'ASC']] }),

    findById: async (id) => {
        const author = await Author.findByPk(id);
        if (!author) throw notFound('Autor não encontrado');
        return author;
    },

    create: async (data) => {
        requireFields(data, ['name']);
        return Author.create(clean(data));
    },

    update: async (id, data) => {
        const author = await authorService.findById(id);
        return author.update(clean(data));
    },

    remove: async (id) => {
        const author = await authorService.findById(id);
        const books = await BookAuthor.count({ where: { authorId: id } });
        if (books > 0) {
            throw conflict(`Não é possível excluir: o autor possui ${books} livro(s) vinculado(s)`);
        }
        await author.destroy();
    }
};

module.exports = authorService;
