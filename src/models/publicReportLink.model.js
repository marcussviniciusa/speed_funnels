const { DataTypes } = require('sequelize');
const crypto = require('crypto');

module.exports = (sequelize) => {
  const PublicReportLink = sequelize.define('PublicReportLink', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    reportId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'report_id',
      references: {
        model: 'reports',
        key: 'id',
      },
    },
    publicId: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: 'public_id',
      defaultValue: () => crypto.randomBytes(32).toString('hex'),
    },
    expiresAt: {
      type: DataTypes.DATE,
      field: 'expires_at',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active',
    },
    createdBy: {
      type: DataTypes.INTEGER,
      field: 'created_by',
      references: {
        model: 'users',
        key: 'id',
      },
    },
  }, {
    tableName: 'public_report_links',
    underscored: true,
    timestamps: true,
  });

  PublicReportLink.associate = (models) => {
    PublicReportLink.belongsTo(models.Report, {
      foreignKey: 'reportId',
      as: 'report',
    });
    
    PublicReportLink.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });
  };

  return PublicReportLink;
}; 