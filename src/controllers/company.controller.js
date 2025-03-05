const { Company, UserCompany, ApiConnection } = require('../models');
const createError = require('http-errors');

// Listar todas as empresas do usuário
exports.getUserCompanies = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Buscar todas as empresas do usuário com suas permissões
    const userCompanies = await UserCompany.findAll({
      where: { userId },
      include: [
        {
          model: Company,
          as: 'company',
          attributes: ['id', 'name', 'logoUrl', 'primaryColor', 'secondaryColor', 'isActive']
        }
      ]
    });
    
    // Transformar os dados para o formato desejado
    const companies = userCompanies.map(uc => ({
      id: uc.company.id,
      name: uc.company.name,
      logoUrl: uc.company.logoUrl,
      primaryColor: uc.company.primaryColor,
      secondaryColor: uc.company.secondaryColor,
      isActive: uc.company.isActive,
      role: uc.role
    }));
    
    res.json({
      success: true,
      data: companies
    });
  } catch (error) {
    console.error('Erro ao listar empresas do usuário:', error);
    next(error);
  }
};

// Obter detalhes de uma empresa específica
exports.getCompanyDetails = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    
    // Verificar se o usuário tem acesso à empresa
    const userCompany = await UserCompany.findOne({
      where: { userId, companyId }
    });
    
    if (!userCompany) {
      throw createError(403, 'Você não tem permissão para acessar esta empresa');
    }
    
    // Buscar detalhes da empresa
    const company = await Company.findByPk(companyId);
    
    if (!company) {
      throw createError(404, 'Empresa não encontrada');
    }
    
    // Buscar integrações da empresa
    const integrations = await ApiConnection.findAll({
      where: { companyId, isActive: true },
      attributes: ['id', 'platform', 'accountId', 'createdAt', 'updatedAt']
    });
    
    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          logoUrl: company.logoUrl,
          primaryColor: company.primaryColor,
          secondaryColor: company.secondaryColor,
          isActive: company.isActive,
          userRole: userCompany.role
        },
        integrations: integrations.map(i => ({
          id: i.id,
          platform: i.platform,
          accountId: i.accountId,
          connectedSince: i.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao obter detalhes da empresa:', error);
    next(error);
  }
};

// Criar uma nova empresa
exports.createCompany = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { name, logoUrl, primaryColor, secondaryColor } = req.body;
    
    // Validar dados
    if (!name) {
      throw createError(400, 'Nome da empresa é obrigatório');
    }
    
    // Criar empresa
    const company = await Company.create({
      name,
      logoUrl,
      primaryColor,
      secondaryColor,
      isActive: true
    });
    
    // Associar usuário à empresa como admin
    await UserCompany.create({
      userId,
      companyId: company.id,
      role: 'admin'
    });
    
    res.status(201).json({
      success: true,
      message: 'Empresa criada com sucesso',
      data: {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor
      }
    });
  } catch (error) {
    console.error('Erro ao criar empresa:', error);
    next(error);
  }
};

// Atualizar uma empresa
exports.updateCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const userId = req.user.id;
    const { name, logoUrl, primaryColor, secondaryColor } = req.body;
    
    // Verificar se o usuário tem permissão de admin na empresa
    const userCompany = await UserCompany.findOne({
      where: { userId, companyId, role: 'admin' }
    });
    
    if (!userCompany) {
      throw createError(403, 'Você não tem permissão para editar esta empresa');
    }
    
    // Buscar empresa
    const company = await Company.findByPk(companyId);
    
    if (!company) {
      throw createError(404, 'Empresa não encontrada');
    }
    
    // Atualizar empresa
    await company.update({
      name: name || company.name,
      logoUrl: logoUrl !== undefined ? logoUrl : company.logoUrl,
      primaryColor: primaryColor || company.primaryColor,
      secondaryColor: secondaryColor || company.secondaryColor
    });
    
    res.json({
      success: true,
      message: 'Empresa atualizada com sucesso',
      data: {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        primaryColor: company.primaryColor,
        secondaryColor: company.secondaryColor
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error);
    next(error);
  }
};

// Adicionar usuário a uma empresa
exports.addUserToCompany = async (req, res, next) => {
  try {
    const { companyId } = req.params;
    const { email, role } = req.body;
    const currentUserId = req.user.id;
    
    // Verificar se o usuário atual tem permissão de admin na empresa
    const currentUserCompany = await UserCompany.findOne({
      where: { userId: currentUserId, companyId, role: 'admin' }
    });
    
    if (!currentUserCompany) {
      throw createError(403, 'Você não tem permissão para adicionar usuários a esta empresa');
    }
    
    // Buscar usuário pelo email
    const { User } = require('../models');
    const user = await User.findOne({ where: { email } });
    
    if (!user) {
      throw createError(404, 'Usuário não encontrado');
    }
    
    // Verificar se o usuário já está associado à empresa
    const existingUserCompany = await UserCompany.findOne({
      where: { userId: user.id, companyId }
    });
    
    if (existingUserCompany) {
      // Atualizar papel se já existir
      await existingUserCompany.update({ role });
      
      res.json({
        success: true,
        message: 'Papel do usuário atualizado com sucesso',
        data: {
          userId: user.id,
          email: user.email,
          role
        }
      });
    } else {
      // Criar nova associação
      await UserCompany.create({
        userId: user.id,
        companyId,
        role
      });
      
      res.status(201).json({
        success: true,
        message: 'Usuário adicionado à empresa com sucesso',
        data: {
          userId: user.id,
          email: user.email,
          role
        }
      });
    }
  } catch (error) {
    console.error('Erro ao adicionar usuário à empresa:', error);
    next(error);
  }
};
