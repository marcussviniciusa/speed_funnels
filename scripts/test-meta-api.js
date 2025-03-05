const axios = require('axios');

// Configurações
const META_API_VERSION = 'v16.0';
const META_BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`;
const META_TOKEN = 'EAAPYcLD5sZBoBO6pw7ZC8yYEZCTINgxuGOr29GrwTo1RFLlD738Wxw2isO4x7HNXK70KXM9nTay5eOiw75AFfHl3T7yBShuitetZB8n8UJfahk6ZBFrfUc22I4wFGYQX07qh3cHp8QYLBmkBDxIuaZCvgRLSXIYjz6vM74bBmuDW0gHaWUcndFVZCpdLsA0x1xP';

// Função para obter informações do usuário
async function getUserInfo() {
  try {
    console.log('Obtendo informações do usuário...');
    
    const response = await axios.get(`${META_BASE_URL}/me`, {
      params: {
        fields: 'id,name,email',
        access_token: META_TOKEN
      }
    });
    
    console.log('Informações do usuário:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Erro ao obter informações do usuário:', error.response?.data || error.message);
    throw error;
  }
}

// Função para obter contas de anúncios
async function getAdAccounts() {
  try {
    console.log('Obtendo contas de anúncios...');
    
    const response = await axios.get(`${META_BASE_URL}/me/adaccounts`, {
      params: {
        fields: 'id,name,account_id,account_status,currency,business,amount_spent',
        access_token: META_TOKEN
      }
    });
    
    console.log('Contas de anúncios:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('Erro ao obter contas de anúncios:', error.response?.data || error.message);
    throw error;
  }
}

// Função para obter campanhas de uma conta de anúncios
async function getCampaigns(adAccountId) {
  try {
    console.log(`Obtendo campanhas da conta ${adAccountId}...`);
    
    const response = await axios.get(`${META_BASE_URL}/act_${adAccountId}/campaigns`, {
      params: {
        fields: 'id,name,status,objective,created_time,start_time,stop_time,daily_budget,lifetime_budget',
        access_token: META_TOKEN
      }
    });
    
    console.log('Campanhas:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('Erro ao obter campanhas:', error.response?.data || error.message);
    throw error;
  }
}

// Função para obter insights de uma campanha
async function getCampaignInsights(campaignId) {
  try {
    console.log(`Obtendo insights da campanha ${campaignId}...`);
    
    const response = await axios.get(`${META_BASE_URL}/${campaignId}/insights`, {
      params: {
        fields: 'campaign_id,campaign_name,impressions,clicks,spend,cpc,ctr,reach,frequency',
        time_range: JSON.stringify({
          since: '2023-01-01',
          until: '2023-12-31'
        }),
        access_token: META_TOKEN
      }
    });
    
    console.log('Insights da campanha:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data.data;
  } catch (error) {
    console.error('Erro ao obter insights da campanha:', error.response?.data || error.message);
    throw error;
  }
}

// Função principal
async function main() {
  try {
    // Obter informações do usuário
    const userInfo = await getUserInfo();
    
    // Obter contas de anúncios
    const adAccounts = await getAdAccounts();
    
    if (adAccounts && adAccounts.length > 0) {
      // Usar a primeira conta de anúncios para obter campanhas
      const adAccountId = adAccounts[0].account_id;
      console.log(`\nUsando a conta de anúncios: ${adAccounts[0].name} (ID: ${adAccountId})`);
      
      // Obter campanhas
      const campaigns = await getCampaigns(adAccountId);
      
      if (campaigns && campaigns.length > 0) {
        // Usar a primeira campanha para obter insights
        const campaignId = campaigns[0].id;
        console.log(`\nUsando a campanha: ${campaigns[0].name} (ID: ${campaignId})`);
        
        // Obter insights da campanha
        await getCampaignInsights(campaignId);
      } else {
        console.log('Nenhuma campanha encontrada para esta conta de anúncios.');
      }
    } else {
      console.log('Nenhuma conta de anúncios encontrada.');
    }
    
    console.log('\nTeste concluído com sucesso!');
  } catch (error) {
    console.error('Erro durante o teste:', error);
  }
}

// Executar função principal
main();
