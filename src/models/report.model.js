const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Report = sequelize.define('Report', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    platforms: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
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
    tableName: 'reports',
    underscored: true,
    timestamps: true,
  });

  Report.associate = (models) => {
    Report.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    });
    
    Report.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });
    
    Report.hasMany(models.PublicReportLink, {
      foreignKey: 'reportId',
      as: 'publicLinks',
    });
    
    Report.hasMany(models.ScheduledReport, {
      foreignKey: 'reportId',
      as: 'schedules',
    });
  };

  return Report;
}; 