const db = require('../config/db');
const User = require('../user/user.model');
const RefreshToken = require('../auth/refreshToken.model');
const Category = require('../category/category.model');
const Author = require('../author/author.model');
const { Book, BookAuthor } = require('../book/book.model');
const Reader = require('../reader/reader.model');
const Loan = require('../loan/loan.model');

Category.hasMany(Book, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'books', onDelete: 'RESTRICT' });
Book.belongsTo(Category, { foreignKey: { name: 'categoryId', allowNull: false }, as: 'category' });

Book.belongsToMany(Author, { through: BookAuthor, foreignKey: 'bookId', otherKey: 'authorId', as: 'authors' });
Author.belongsToMany(Book, { through: BookAuthor, foreignKey: 'authorId', otherKey: 'bookId', as: 'books' });

Book.hasMany(Loan, { foreignKey: { name: 'bookId', allowNull: false }, as: 'loans', onDelete: 'RESTRICT' });
Loan.belongsTo(Book, { foreignKey: { name: 'bookId', allowNull: false }, as: 'book' });

Reader.hasMany(Loan, { foreignKey: { name: 'readerId', allowNull: false }, as: 'loans', onDelete: 'RESTRICT' });
Loan.belongsTo(Reader, { foreignKey: { name: 'readerId', allowNull: false }, as: 'reader' });

User.hasMany(Loan, { foreignKey: { name: 'userId', allowNull: false }, as: 'loans', onDelete: 'RESTRICT' });
Loan.belongsTo(User, { foreignKey: { name: 'userId', allowNull: false }, as: 'attendant' });

User.hasMany(RefreshToken, { foreignKey: 'userId', as: 'refreshTokens', onDelete: 'CASCADE' });
RefreshToken.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { db, User, RefreshToken, Category, Author, Book, BookAuthor, Reader, Loan };
