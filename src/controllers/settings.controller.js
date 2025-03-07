/**
 * Controlador de configurações
 */
const { User, ApiConnection, Company } = require('../models');
const createError = require('http-errors');
const metaService = require('../services/metaService');

// Obter configurações da conta
exports.getAccountSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar informações do usuário
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'role', 'lastLogin', 'createdAt']
    });
    
    if (!user) {
      throw createError(404, 'Usuário não encontrado');
    }
    
    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao obter configurações da conta:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      error: error.message || 'Erro ao obter configurações da conta' 
    });
  }
};

// Atualizar configurações da conta
exports.updateAccountSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, email } = req.body;
    
    // Validar dados
    if (!name && !email) {
      throw createError(400, 'Nenhum dado fornecido para atualização');
    }
    
    // Buscar usuário
    const user = await User.findByPk(userId);
    
    if (!user) {
      throw createError(404, 'Usuário não encontrado');
    }
    
    // Atualizar dados
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    
    await user.update(updateData);
    
    res.json({
      success: true,
      message: 'Configurações da conta atualizadas com sucesso',
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações da conta:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      error: error.message || 'Erro ao atualizar configurações da conta' 
    });
  }
};

// Obter configurações de notificações
exports.getNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Implementação futura - por enquanto retorna configurações padrão
    res.json({
      success: true,
      data: {
        emailNotifications: true,
        pushNotifications: false,
        reportFrequency: 'weekly',
        alertThreshold: 'medium'
      }
    });
  } catch (error) {
    console.error('Erro ao obter configurações de notificações:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      error: error.message || 'Erro ao obter configurações de notificações' 
    });
  }
};

// Atualizar configurações de notificações
exports.updateNotificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailNotifications, pushNotifications, reportFrequency, alertThreshold } = req.body;
    
    // Implementação futura - por enquanto apenas retorna os dados recebidos
    res.json({
      success: true,
      message: 'Configurações de notificações atualizadas com sucesso',
      data: {
        emailNotifications: emailNotifications === undefined ? true : emailNotifications,
        pushNotifications: pushNotifications === undefined ? false : pushNotifications,
        reportFrequency: reportFrequency || 'weekly',
        alertThreshold: alertThreshold || 'medium'
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar configurações de notificações:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      error: error.message || 'Erro ao atualizar configurações de notificações' 
    });
  }
};

// Obter configurações de integrações
exports.getIntegrationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Buscar todas as integrações do usuário
    const connections = await ApiConnection.findAll({
      where: { userId },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logoUrl']
        }
      ]
    });
    
    // Transformar dados para resposta
    const integrations = {
      meta: connections
        .filter(conn => conn.platform === 'meta')
        .map(conn => ({
          id: conn.id,
          companyId: conn.companyId,
          companyName: conn.company ? conn.company.name : 'Empresa não encontrada',
          accountId: conn.accountId,
          accountName: conn.accountName,
          isActive: conn.isActive,
          connectedAt: conn.createdAt
        })),
      google: connections
        .filter(conn => conn.platform === 'google')
        .map(conn => ({
          id: conn.id,
          companyId: conn.companyId,
          companyName: conn.company ? conn.company.name : 'Empresa não encontrada',
          accountId: conn.accountId,
          accountName: conn.accountName,
          isActive: conn.isActive,
          connectedAt: conn.createdAt
        }))
    };
    
    res.json({
      success: true,
      data: integrations
    });
  } catch (error) {
    console.error('Erro ao obter configurações de integrações:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      error: error.message || 'Erro ao obter configurações de integrações' 
    });
  }
};

// Atualizar configurações de integrações
exports.updateIntegrationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { provider } = req.params;
    const { integrationId, isActive } = req.body;
    
    // Validar provider
    if (!['meta', 'facebook', 'google'].includes(provider)) {
      throw createError(400, `Provedor ${provider} não suportado`);
    }
    
    // Se for facebook, tratar como meta
    const platform = provider === 'facebook' ? 'meta' : provider;
    
    if (integrationId) {
      // Atualizar integração específica
      const connection = await ApiConnection.findOne({
        where: {
          id: integrationId,
          userId,
          platform
        }
      });
      
      if (!connection) {
        throw createError(404, 'Integração não encontrada');
      }
      
      await connection.update({ isActive: isActive === undefined ? connection.isActive : isActive });
      
      res.json({
        success: true,
        message: `Configurações de integração do ${platform} atualizadas com sucesso`,
        data: {
          id: connection.id,
          platform: connection.platform,
          isActive: connection.isActive
        }
      });
    } else {
      // Atualizar todas as integrações do provider
      await ApiConnection.update(
        { isActive: isActive === undefined ? true : isActive },
        { 
          where: {
            userId,
            platform
          }
        }
      );
      
      res.json({
        success: true,
        message: `Todas as configurações de integração do ${platform} foram atualizadas com sucesso`
      });
    }
  } catch (error) {
    console.error('Erro ao atualizar configurações de integrações:', error);
    res.status(error.status || 500).json({ 
      success: false, 
      error: error.message || 'Erro ao atualizar configurações de integrações' 
    });
  }
};
