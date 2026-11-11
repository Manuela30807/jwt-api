const db = require('../config/db');
const { DataTypes } = require('sequelize');

const LogoutList = db.define('logout_list', {
    token: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

module.exports = LogoutList;