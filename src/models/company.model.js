const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Company = sequelize.define('Company', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    logoUrl: {
      type: DataTypes.STRING(255),
      field: 'logo_url',
    },
    primaryColor: {
      type: DataTypes.STRING(20),
      field: 'primary_color',
    },
    secondaryColor: {
      type: DataTypes.STRING(20),
      field: 'secondary_color',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  }, {
    tableName: 'companies',
    underscored: true,
    timestamps: true,
  });

  Company.associate = (models) => {
    Company.belongsToMany(models.User, {
      through: models.UserCompany,
      foreignKey: 'companyId',
      as: 'users',
    });
    
    Company.hasMany(models.ApiConnection, {
      foreignKey: 'companyId',
      as: 'apiConnections',
    });
    
    Company.hasMany(models.Report, {
      foreignKey: 'companyId',
      as: 'reports',
    });
  };

  return Company;
}; 