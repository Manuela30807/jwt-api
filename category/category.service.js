const { Category, Book } = require('../models');
const { notFound, conflict } = require('../utils/httpError');
const { requireFields, pick } = require('../utils/validate');

const categoryService = {
    findAll: () => Category.findAll({ order: [['name', 'ASC']] }),

    findById: async (id) => {
        const category = await Category.findByPk(id);
        if (!category) throw notFound('Categoria não encontrada');
        return category;
    },

    create: async (data) => {
        requireFields(data, ['name']);
        return Category.create(pick(data, ['name', 'description']));
    },

    update: async (id, data) => {
        const category = await categoryService.findById(id);
        return category.update(pick(data, ['name', 'description']));
    },

    remove: async (id) => {
        const category = await categoryService.findById(id);
        const books = await Book.count({ where: { categoryId: id } });
        if (books > 0) {
            throw conflict(`Não é possível excluir: a categoria possui ${books} livro(s) vinculado(s)`);
        }
        await category.destroy();
    }
};

module.exports = categoryService;
