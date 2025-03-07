import api from './api';

/**
 * Serviço para obter e processar métricas de diferentes plataformas
 */
const metricsService = {
  /**
   * Obtém métricas do Meta Ads
   * @param {string} adAccountId - ID da conta de anúncios
   * @param {Object} dateRange - Período de datas para as métricas
   * @returns {Promise} Promise com os dados das métricas
   */
  getMetaMetrics: async (adAccountId, dateRange) => {
    try {
      console.log(`Solicitando métricas do Meta para conta: ${adAccountId}`);
      console.log('Período:', dateRange);
      
      const response = await api.get(`/api/metrics/meta/${adAccountId}`, {
        params: dateRange
      });
      
      console.log('Resposta recebida:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erro ao obter métricas do Meta Ads:', error);
      throw error;
    }
  },

  /**
   * Obtém métricas do Google Analytics
   * @param {string} propertyId - ID da propriedade do GA4
   * @param {Object} dateRange - Período de datas para as métricas
   * @returns {Promise} Promise com os dados das métricas
   */
  getGoogleMetrics: async (propertyId, dateRange) => {
    try {
      const response = await api.get(`/api/metrics/google/${propertyId}`, {
        params: dateRange
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao obter métricas do Google Analytics:', error);
      throw error;
    }
  },

  /**
   * Obtém contas de anúncios disponíveis no Meta Ads
   * @returns {Promise} Promise com a lista de contas de anúncios
   */
  getMetaAdAccounts: async () => {
    try {
      const response = await api.get('/api/metrics/meta/accounts');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter contas de anúncios do Meta:', error);
      throw error;
    }
  },

  /**
   * Obtém propriedades disponíveis no Google Analytics
   * @returns {Promise} Promise com a lista de propriedades
   */
  getGoogleProperties: async () => {
    try {
      const response = await api.get('/api/metrics/google/properties');
      return response.data;
    } catch (error) {
      console.error('Erro ao obter propriedades do Google Analytics:', error);
      throw error;
    }
  },

  /**
   * Processa e combina métricas de diferentes plataformas
   * @param {Object} metaMetrics - Métricas do Meta Ads
   * @param {Object} googleMetrics - Métricas do Google Analytics
   * @returns {Object} Métricas combinadas e processadas
   */
  processCombinedMetrics: (metaMetrics, googleMetrics) => {
    // Processamento de métricas combinadas
    const combinedData = {
      // Métricas de aquisição
      acquisition: {
        totalVisits: googleMetrics?.totalVisits || 0,
        newUsers: googleMetrics?.newUsers || 0,
        sessions: googleMetrics?.sessions || 0,
        adClicks: metaMetrics?.clicks || 0,
        adImpressions: metaMetrics?.impressions || 0,
      },
      
      // Métricas de engajamento
      engagement: {
        engagementRate: googleMetrics?.engagementRate || 0,
        avgSessionDuration: googleMetrics?.avgSessionDuration || 0,
        pageViewsPerSession: googleMetrics?.pageViewsPerSession || 0,
      },
      
      // Métricas de conversão
      conversion: {
        conversions: googleMetrics?.conversions || 0,
        conversionRate: googleMetrics?.conversionRate || 0,
        costPerConversion: metaMetrics?.costPerResult || 0,
      },
      
      // Métricas de custo
      cost: {
        adSpend: metaMetrics?.spend || 0,
        cpm: metaMetrics?.cpm || 0,
        cpc: metaMetrics?.cpc || 0,
        ctr: metaMetrics?.ctr || 0,
      },
      
      // Dados por campanha
      campaigns: metaMetrics?.campaigns || [],
      
      // Dados por fonte de tráfego
      trafficSources: googleMetrics?.trafficSources || [],
    };
    
    return combinedData;
  },
  
  /**
   * Gera dados para gráficos a partir das métricas
   * @param {Object} metrics - Métricas processadas
   * @returns {Object} Dados formatados para gráficos
   */
  generateChartData: (metrics) => {
    // Exemplo de dados para gráficos
    return {
      trafficSourceChart: {
        labels: metrics.trafficSources.map(source => source.name),
        datasets: [{
          label: 'Sessões',
          data: metrics.trafficSources.map(source => source.sessions),
          backgroundColor: [
            '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b',
            '#5a5c69', '#858796', '#6610f2', '#fd7e14', '#20c9a6'
          ],
        }]
      },
      
      campaignPerformanceChart: {
        labels: metrics.campaigns.map(campaign => campaign.name),
        datasets: [
          {
            label: 'Gasto (R$)',
            data: metrics.campaigns.map(campaign => campaign.spend),
            borderColor: '#4e73df',
            backgroundColor: 'rgba(78, 115, 223, 0.05)',
            pointBackgroundColor: '#4e73df',
            tension: 0.3,
          },
          {
            label: 'Cliques',
            data: metrics.campaigns.map(campaign => campaign.clicks),
            borderColor: '#1cc88a',
            backgroundColor: 'rgba(28, 200, 138, 0.05)',
            pointBackgroundColor: '#1cc88a',
            tension: 0.3,
          }
        ]
      },
      
      conversionTrendChart: {
        // Dados de tendência de conversão ao longo do tempo
        // Seria necessário dados temporais para implementar corretamente
      }
    };
  }
};

export default metricsService;
