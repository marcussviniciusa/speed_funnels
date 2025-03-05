const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ScheduledReport = sequelize.define('ScheduledReport', {
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
    frequency: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [['daily', 'weekly', 'monthly']]
      }
    },
    recipients: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: [],
    },
    nextRun: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'next_run',
    },
    lastRun: {
      type: DataTypes.DATE,
      field: 'last_run',
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
    tableName: 'scheduled_reports',
    underscored: true,
    timestamps: true,
  });

  ScheduledReport.associate = (models) => {
    ScheduledReport.belongsTo(models.Report, {
      foreignKey: 'reportId',
      as: 'report',
    });
    
    ScheduledReport.belongsTo(models.User, {
      foreignKey: 'createdBy',
      as: 'creator',
    });
  };

  return ScheduledReport;
}; 