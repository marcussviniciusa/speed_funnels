const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ApiConnection = sequelize.define('ApiConnection', {
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
    platform: {
      type: DataTypes.STRING(50),
      allowNull: false,
      validate: {
        isIn: [['meta', 'google_analytics']],
      },
    },
    accessToken: {
      type: DataTypes.TEXT,
      field: 'access_token',
    },
    refreshToken: {
      type: DataTypes.TEXT,
      field: 'refresh_token',
    },
    tokenExpiresAt: {
      type: DataTypes.DATE,
      field: 'token_expires_at',
    },
    accountId: {
      type: DataTypes.STRING(100),
      field: 'account_id',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
  }, {
    tableName: 'api_connections',
    underscored: true,
    timestamps: true,
  });

  ApiConnection.associate = (models) => {
    ApiConnection.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    });
    ApiConnection.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
    });
  };

  return ApiConnection;
};