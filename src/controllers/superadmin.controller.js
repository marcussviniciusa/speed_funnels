const { User, Company, UserCompany } = require('../models');
const sequelize = require('sequelize');
const { Op } = require('sequelize');

/**
 * Get system dashboard statistics for superadmin
 */
const getDashboardStats = async (req, res) => {
  try {
    const totalCompanies = await Company.count();
    const activeCompanies = await Company.count({ where: { isActive: true } });
    const totalUsers = await User.count();
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    
    // Get companies created in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCompanies = await Company.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });
    
    // Get users created in the last 30 days
    const newUsers = await User.count({
      where: {
        createdAt: { [Op.gte]: thirtyDaysAgo }
      }
    });
    
    return res.status(200).json({
      totalCompanies,
      activeCompanies,
      inactiveCompanies: totalCompanies - activeCompanies,
      totalUsers,
      totalAdmins,
      newCompanies,
      newUsers
    });
  } catch (error) {
    console.error('Error getting superadmin dashboard stats:', error);
    return res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

/**
 * Get all companies with pagination and filters
 */
const getCompanies = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status;
    
    const whereClause = {};
    
    if (search) {
      whereClause.name = { [Op.like]: `%${search}%` };
    }
    
    if (status === 'active') {
      whereClause.isActive = true;
    } else if (status === 'inactive') {
      whereClause.isActive = false;
    }
    
    const { count, rows } = await Company.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include: [{
        model: User,
        as: 'users',
        attributes: ['id'],
        through: { attributes: [] }
      }]
    });
    
    // Add user count to each company
    const companies = rows.map(company => {
      const plainCompany = company.get({ plain: true });
      plainCompany.userCount = plainCompany.users.length;
      delete plainCompany.users; // Remove users array to keep response light
      return plainCompany;
    });
    
    return res.status(200).json({
      companies,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error getting companies:', error);
    return res.status(500).json({ message: 'Error fetching companies' });
  }
};

/**
 * Create a new company
 */
const createCompany = async (req, res) => {
  const { name, logoUrl, primaryColor, secondaryColor } = req.body;
  
  try {
    if (!name) {
      return res.status(400).json({ message: 'Company name is required' });
    }
    
    const newCompany = await Company.create({
      name,
      logoUrl,
      primaryColor,
      secondaryColor,
      isActive: true
    });
    
    // Create audit log entry
    await createAuditLog(req.user.id, 'create_company', 'Created new company', { companyId: newCompany.id }, req);
    
    return res.status(201).json(newCompany);
  } catch (error) {
    console.error('Error creating company:', error);
    return res.status(500).json({ message: 'Error creating company' });
  }
};

/**
 * Update an existing company
 */
const updateCompany = async (req, res) => {
  const { id } = req.params;
  const { name, logoUrl, primaryColor, secondaryColor, isActive } = req.body;
  
  try {
    const company = await Company.findByPk(id);
    
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }
    
    const updatedCompany = await company.update({
      name: name || company.name,
      logoUrl: logoUrl !== undefined ? logoUrl : company.logoUrl,
      primaryColor: primaryColor || company.primaryColor,
      secondaryColor: secondaryColor || company.secondaryColor,
      isActive: isActive !== undefined ? isActive : company.isActive
    });
    
    // Create audit log entry
    await createAuditLog(req.user.id, 'update_company', 'Updated company', { companyId: id }, req);
    
    return res.status(200).json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    return res.status(500).json({ message: 'Error updating company' });
  }
};

/**
 * Get all system users with pagination and filters
 */
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const role = req.query.role;
    const companyId = req.query.companyId;
    
    const whereClause = {};
    
    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    const include = [{
      model: Company,
      as: 'companies',
      through: {
        model: UserCompany,
        as: 'userCompany',
        attributes: ['role']
      }
    }];
    
    if (companyId) {
      include[0].where = { id: companyId };
    }
    
    const { count, rows } = await User.findAndCountAll({
      where: whereClause,
      limit,
      offset,
      order: [['createdAt', 'DESC']],
      include,
      distinct: true
    });
    
    // Remove password from user objects
    const users = rows.map(user => {
      const plainUser = user.get({ plain: true });
      delete plainUser.password;
      return plainUser;
    });
    
    return res.status(200).json({
      users,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    console.error('Error getting users:', error);
    return res.status(500).json({ message: 'Error fetching users' });
  }
};

/**
 * Create a new user
 */
const createUser = async (req, res) => {
  const { name, email, password, role, companyIds, companyRoles } = req.body;
  
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email and password are required' });
    }
    
    // Check if email is already in use
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    
    // Create transaction to ensure user and company associations are created together
    const result = await sequelize.transaction(async (t) => {
      // Create new user
      const newUser = await User.create({
        name,
        email,
        password,
        role: role || 'user'
      }, { transaction: t });
      
      // Associate user with companies if provided
      if (companyIds && companyIds.length > 0) {
        const userCompanies = companyIds.map((companyId, index) => ({
          userId: newUser.id,
          companyId,
          role: companyRoles && companyRoles[index] ? companyRoles[index] : 'viewer'
        }));
        
        await UserCompany.bulkCreate(userCompanies, { transaction: t });
      }
      
      return newUser;
    });
    
    // Create audit log entry
    await createAuditLog(req.user.id, 'create_user', 'Created new user', { userId: result.id }, req);
    
    // Remove password from response
    const user = result.get({ plain: true });
    delete user.password;
    
    return res.status(201).json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Error creating user' });
  }
};

/**
 * Update an existing user
 */
const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, email, password, role, companyIds, companyRoles } = req.body;
  
  try {
    const user = await User.findByPk(id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if email is already in use by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
    }
    
    // Create transaction to ensure user and company associations are updated together
    await sequelize.transaction(async (t) => {
      // Update user
      const updates = {
        name: name || user.name,
        email: email || user.email,
        role: role || user.role
      };
      
      if (password) {
        updates.password = password;
      }
      
      await user.update(updates, { transaction: t });
      
      // Update company associations if provided
      if (companyIds && companyIds.length > 0) {
        // First, remove all existing associations
        await UserCompany.destroy({
          where: { userId: id },
          transaction: t
        });
        
        // Then, create new associations
        const userCompanies = companyIds.map((companyId, index) => ({
          userId: id,
          companyId,
          role: companyRoles && companyRoles[index] ? companyRoles[index] : 'viewer'
        }));
        
        await UserCompany.bulkCreate(userCompanies, { transaction: t });
      }
    });
    
    // Create audit log entry
    await createAuditLog(req.user.id, 'update_user', 'Updated user', { userId: id }, req);
    
    // Get updated user with companies
    const updatedUser = await User.findByPk(id, {
      include: [{
        model: Company,
        as: 'companies',
        through: {
          model: UserCompany,
          as: 'userCompany',
          attributes: ['role']
        }
      }]
    });
    
    // Remove password from response
    const userResponse = updatedUser.get({ plain: true });
    delete userResponse.password;
    
    return res.status(200).json(userResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Error updating user' });
  }
};

/**
 * Transfer a user from one company to another
 */
const transferUser = async (req, res) => {
  const { userId, fromCompanyId, toCompanyId, role } = req.body;
  
  try {
    if (!userId || !fromCompanyId || !toCompanyId) {
      return res.status(400).json({ message: 'User ID, source and destination company IDs are required' });
    }
    
    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Check if both companies exist
    const companies = await Company.findAll({
      where: { id: [fromCompanyId, toCompanyId] }
    });
    
    if (companies.length !== 2) {
      return res.status(404).json({ message: 'One or both companies not found' });
    }
    
    // Check if user is associated with the source company
    const userCompany = await UserCompany.findOne({
      where: { userId, companyId: fromCompanyId }
    });
    
    if (!userCompany) {
      return res.status(404).json({ message: 'User is not associated with the source company' });
    }
    
    // Check if user is already associated with the destination company
    const existingAssociation = await UserCompany.findOne({
      where: { userId, companyId: toCompanyId }
    });
    
    await sequelize.transaction(async (t) => {
      // Remove association with source company
      await UserCompany.destroy({
        where: { userId, companyId: fromCompanyId },
        transaction: t
      });
      
      // Create or update association with destination company
      if (existingAssociation) {
        await existingAssociation.update({
          role: role || existingAssociation.role
        }, { transaction: t });
      } else {
        await UserCompany.create({
          userId,
          companyId: toCompanyId,
          role: role || userCompany.role
        }, { transaction: t });
      }
    });
    
    // Create audit log entry
    await createAuditLog(
      req.user.id, 
      'transfer_user', 
      'Transferred user between companies', 
      { userId, fromCompanyId, toCompanyId },
      req
    );
    
    return res.status(200).json({ message: 'User transferred successfully' });
  } catch (error) {
    console.error('Error transferring user:', error);
    return res.status(500).json({ message: 'Error transferring user' });
  }
};

/**
 * Create an audit log entry for superadmin actions
 * Private function used internally by controller methods
 */
const createAuditLog = async (userId, action, description, metadata, req = null) => {
  try {
    const { AuditLog } = require('../models');
    await AuditLog.create({
      userId,
      action,
      description,
      metadata: JSON.stringify(metadata),
      ipAddress: req ? req.ip : null,
      userAgent: req ? req.headers['user-agent'] : null
    });
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error to prevent disrupting the main operation
  }
};

module.exports = {
  getDashboardStats,
  getCompanies,
  createCompany,
  updateCompany,
  getUsers,
  createUser,
  updateUser,
  transferUser
};
