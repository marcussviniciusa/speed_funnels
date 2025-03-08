const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdData = sequelize.define('AdData', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    connectionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'connection_id',
      references: {
        model: 'api_connections',
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
    adAccountId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: 'ad_account_id',
    },
    campaignId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'campaign_id',
    },
    campaignName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'campaign_name',
    },
    adsetId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'adset_id',
    },
    adsetName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'adset_name',
    },
    adId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'ad_id',
    },
    adName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: 'ad_name',
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    impressions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    clicks: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    spend: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    currency: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    reach: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    frequency: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    cpc: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    cpm: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    ctr: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    conversions: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    costPerConversion: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
      field: 'cost_per_conversion',
    },
    dateStart: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'date_start',
    },
    dateEnd: {
      type: DataTypes.DATE,
      allowNull: false,
      field: 'date_end',
    },
    lastSyncedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'last_synced_at',
    },
    rawData: {
      type: DataTypes.JSON,
      allowNull: true,
      field: 'raw_data',
    },
  }, {
    tableName: 'ad_data',
    underscored: true,
    timestamps: true,
    indexes: [
      {
        unique: false,
        fields: ['connection_id']
      },
      {
        unique: false,
        fields: ['company_id']
      },
      {
        unique: false,
        fields: ['ad_account_id']
      },
      {
        unique: false,
        fields: ['date_start', 'date_end']
      }
    ]
  });

  AdData.associate = (models) => {
    AdData.belongsTo(models.ApiConnection, {
      foreignKey: 'connectionId',
      as: 'connection',
    });
    AdData.belongsTo(models.Company, {
      foreignKey: 'companyId',
      as: 'company',
    });
  };

  return AdData;
};
