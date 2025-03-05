const axios = require('axios');
const readline = require('readline');

// Configurações
const API_URL = 'http://localhost:3001';
const META_TOKEN = 'EAAPYcLD5sZBoBO6pw7ZC8yYEZCTINgxuGOr29GrwTo1RFLlD738Wxw2isO4x7HNXK70KXM9nTay5eOiw75AFfHl3T7yBShuitetZB8n8UJfahk6ZBFrfUc22I4wFGYQX07qh3cHp8QYLBmkBDxIuaZCvgRLSXIYjz6vM74bBmuDW0gHaWUcndFVZCpdLsA0x1xP';

// Criar interface de linha de comando
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para fazer login e obter token JWT
async function login() {
  try {
    console.log('Fazendo login...');
    
    // Solicitar credenciais
    const email = await new Promise(resolve => {
      rl.question('Email: ', resolve);
    });
    
    const password = await new Promise(resolve => {
      rl.question('Senha: ', resolve);
    });
    
    // Fazer requisição de login
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email,
      password
    });
    
    if (response.data && response.data.token) {
      console.log('Login bem-sucedido!');
      return response.data.token;
    } else {
      console.error('Falha no login: Token não recebido');
      process.exit(1);
    }
  } catch (error) {
    console.error('Erro ao fazer login:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Função para conectar com o Meta Ads
async function connectMeta(token, companyId) {
  try {
    console.log(`Conectando com Meta Ads para empresa ${companyId}...`);
    
    const response = await axios.post(
      `${API_URL}/api/integrations/meta/connect/${companyId}`,
      { accessToken: META_TOKEN },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('Conexão com Meta Ads realizada com sucesso!');
      console.log('Detalhes da conexão:');
      console.log(`- ID da conexão: ${response.data.data.connectionId}`);
      console.log(`- Plataforma: ${response.data.data.platform}`);
      console.log(`- ID da conta: ${response.data.data.accountId}`);
      console.log(`- Nome da conta: ${response.data.data.accountName}`);
      
      if (response.data.data.adAccounts && response.data.data.adAccounts.length > 0) {
        console.log('\nContas de anúncios disponíveis:');
        response.data.data.adAccounts.forEach((account, index) => {
          console.log(`${index + 1}. ${account.name} (ID: ${account.id})`);
        });
      }
    } else {
      console.error('Falha na conexão com Meta Ads');
    }
  } catch (error) {
    console.error('Erro ao conectar com Meta Ads:', error.response?.data || error.message);
  }
}

// Função principal
async function main() {
  try {
    // Fazer login
    const token = await login();
    
    // Solicitar ID da empresa
    const companyId = await new Promise(resolve => {
      rl.question('ID da empresa (ou deixe em branco para usar "1"): ', (answer) => {
        resolve(answer || '1');
      });
    });
    
    // Conectar com o Meta Ads
    await connectMeta(token, companyId);
    
    rl.close();
  } catch (error) {
    console.error('Erro:', error);
    rl.close();
  }
}

// Executar função principal
main();
