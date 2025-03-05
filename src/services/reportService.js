const metaService = require('./metaService');
const googleAnalyticsService = require('./googleAnalyticsService');

// Gerar dados para um relatório com base na configuração
exports.generateReportData = async (config, connections) => {
  try {
    const { startDate, endDate, metrics, dimensions, platforms } = config;
    const result = {
      meta: {
        startDate,
        endDate,
        generatedAt: new Date(),
      },
      platforms: {},
    };

    // Processar dados do Meta Ads
    if (platforms.includes('meta') && connections.meta) {
      try {
        const metaData = await metaService.getCampaignMetrics(
          connections.meta.accessToken,
          connections.meta.accountId.replace('act_', ''),
          { startDate, endDate, metrics: metrics.meta || [] }
        );
        result.platforms.meta = metaData;
      } catch (error) {
        console.error('Erro ao obter dados do Meta:', error);
        result.platforms.meta = { error: 'Falha ao obter dados do Meta Ads' };
      }
    }

    // Processar dados do Google Analytics
    if (platforms.includes('google') && connections.google) {
      try {
        const googleData = await googleAnalyticsService.getAnalyticsData(
          connections.google.accessToken,
          connections.google.viewId,
          { startDate, endDate, metrics: metrics.google || [], dimensions: dimensions.google || [] }
        );
        result.platforms.google = googleData;
      } catch (error) {
        console.error('Erro ao obter dados do Google Analytics:', error);
        result.platforms.google = { error: 'Falha ao obter dados do Google Analytics' };
      }
    }

    return result;
  } catch (error) {
    console.error('Erro ao gerar dados do relatório:', error);
    throw error;
  }
};

// Gerar um relatório em formato HTML
exports.generateReportHtml = (reportData, reportConfig) => {
  // Simulação de geração de HTML para o relatório
  return `
    <html>
      <head>
        <title>${reportConfig.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          h1 { color: #2196f3; }
          .card { border: 1px solid #ddd; border-radius: 4px; padding: 15px; margin-bottom: 20px; }
          .metric { font-size: 24px; font-weight: bold; }
          .label { color: #666; }
        </style>
      </head>
      <body>
        <h1>${reportConfig.name}</h1>
        <p>Período: ${reportData.meta.startDate} a ${reportData.meta.endDate}</p>
        <p>Gerado em: ${new Date(reportData.meta.generatedAt).toLocaleString()}</p>
        
        <div class="report-content">
          <p>Este é um relatório simulado para fins de teste.</p>
          <div class="card">
            <div class="metric">1,234</div>
            <div class="label">Cliques</div>
          </div>
          <div class="card">
            <div class="metric">$567.89</div>
            <div class="label">Custo</div>
          </div>
          <div class="card">
            <div class="metric">0.46%</div>
            <div class="label">Taxa de Conversão</div>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Gerar dados simulados para testes
exports.generateMockData = (config) => {
  return {
    meta: {
      startDate: config.startDate || '2023-01-01',
      endDate: config.endDate || '2023-01-31',
      generatedAt: new Date(),
    },
    platforms: {
      meta: {
        campaigns: [
          { id: '123456', name: 'Campanha 1', spend: 1234.56, impressions: 98765, clicks: 4321 },
          { id: '789012', name: 'Campanha 2', spend: 567.89, impressions: 45678, clicks: 2345 },
        ],
        summary: {
          spend: 1802.45,
          impressions: 144443,
          clicks: 6666,
          ctr: 0.0461,
          cpc: 0.27,
        },
      },
      google: {
        data: [
          { dimension: 'Orgânico', sessions: 12345, users: 9876, bounceRate: 0.34 },
          { dimension: 'Direto', sessions: 5432, users: 4321, bounceRate: 0.28 },
          { dimension: 'Social', sessions: 2345, users: 1987, bounceRate: 0.42 },
        ],
        summary: {
          sessions: 20122,
          users: 16184,
          pageviews: 45678,
          avgSessionDuration: 124,
        },
      },
    },
  };
};
