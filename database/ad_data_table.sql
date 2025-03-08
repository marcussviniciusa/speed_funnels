-- Tabela de dados de anúncios
CREATE TABLE ad_data (
  id SERIAL PRIMARY KEY,
  connection_id INTEGER REFERENCES api_connections(id) ON DELETE CASCADE,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  ad_account_id VARCHAR(100) NOT NULL,
  campaign_id VARCHAR(100),
  campaign_name VARCHAR(255),
  adset_id VARCHAR(100),
  adset_name VARCHAR(255),
  ad_id VARCHAR(100),
  ad_name VARCHAR(255),
  status VARCHAR(50),
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  spend DECIMAL(10, 2) DEFAULT 0,
  currency VARCHAR(10),
  reach INTEGER DEFAULT 0,
  frequency DECIMAL(10, 2) DEFAULT 0,
  cpc DECIMAL(10, 2) DEFAULT 0,
  cpm DECIMAL(10, 2) DEFAULT 0,
  ctr DECIMAL(10, 2) DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  cost_per_conversion DECIMAL(10, 2) DEFAULT 0,
  date_start TIMESTAMP NOT NULL,
  date_end TIMESTAMP NOT NULL,
  last_synced_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  raw_data JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para otimização de consultas
CREATE INDEX idx_ad_data_connection_id ON ad_data(connection_id);
CREATE INDEX idx_ad_data_company_id ON ad_data(company_id);
CREATE INDEX idx_ad_data_ad_account_id ON ad_data(ad_account_id);
CREATE INDEX idx_ad_data_campaign_id ON ad_data(campaign_id);
CREATE INDEX idx_ad_data_adset_id ON ad_data(adset_id);
CREATE INDEX idx_ad_data_ad_id ON ad_data(ad_id);
CREATE INDEX idx_ad_data_date_range ON ad_data(date_start, date_end);
