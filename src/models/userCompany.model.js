const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserCompany = sequelize.define('UserCompany', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id',
      },
    },
    companyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'company_id',
      references: {
        model: 'companies',
        key: 'id',
      },
    },
    role: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['admin', 'editor', 'viewer']],
      },
    },
  }, {
    tableName: 'user_companies',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'company_id'],
      },
    ],
  });

  // Adicionar associações para o modelo UserCompany
  UserCompany.associate = (models) => {
    UserCompany.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    
    UserCompany.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company'
    });
  };

  return UserCompany;
};
