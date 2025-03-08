const { ApiConnection } = require('../models');
const metaService = require('../services/metaService');

// Buscar anúncios de uma conta do Meta
exports.getMetaAds = async (req, res, next) => {
  try {
    const { accountId } = req.params;
    const userId = req.user.id;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'ID da conta de anúncios é obrigatório'
      });
    }
    
    console.log(`Buscando anúncios da conta ${accountId} para o usuário ${userId}`);
    
    // Buscar uma conexão válida para a conta
    const connection = await ApiConnection.findOne({
      where: {
        user_id: userId,
        platform: 'meta',
        is_active: true
      },
      order: [['created_at', 'DESC']]
    });
    
    if (!connection) {
      console.error(`Nenhuma conexão Meta ativa encontrada para o usuário ${userId}`);
      return res.status(404).json({
        success: false,
        error: 'Conexão com Meta não encontrada. Faça login novamente.'
      });
    }
    
    // Verificar se o token de acesso é válido
    const tokenValidation = await metaService.validateToken(connection.access_token || connection.accessToken);
    
    if (!tokenValidation.isValid) {
      console.error(`Token inválido para a conexão ${connection.id}`);
      return res.status(401).json({
        success: false,
        error: 'Token de acesso inválido ou expirado. Faça login novamente.'
      });
    }
    
    // Buscar anúncios da conta
    const result = await metaService.getAds(connection.access_token || connection.accessToken, accountId);
    
    // Retornar os dados dos anúncios
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Erro ao buscar anúncios do Meta:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar anúncios'
    });
  }
};
