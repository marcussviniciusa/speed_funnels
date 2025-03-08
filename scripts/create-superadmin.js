/**
 * Script para criar um usuário superadmin
 * 
 * Uso: node create-superadmin.js
 */

require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcrypt'); // Mudando de bcryptjs para bcrypt
const { User } = require('../src/models');
const { sequelize } = require('../src/models');

async function createSuperAdmin() {
  try {
    // Configurações do superadmin
    const superadminData = {
      name: 'Superadmin',
      email: 'superadmin@speedfunnels.com',
      password: await bcrypt.hash('superadmin123', 10),
      role: 'superadmin',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Verificar se já existe um usuário com este email
    const existingUser = await User.findOne({ where: { email: superadminData.email } });
    
    if (existingUser) {
      // Atualizar usuário existente para superadmin
      await existingUser.update({
        role: 'superadmin',
        password: superadminData.password
      });
      console.log(`Usuário '${existingUser.email}' atualizado para superadmin!`);
      console.log('Detalhes:');
      console.log(`- Nome: ${existingUser.name}`);
      console.log(`- Email: ${existingUser.email}`);
      console.log(`- Senha: superadmin123`);
    } else {
      // Criar novo usuário superadmin
      const newSuperadmin = await User.create(superadminData);
      console.log('Superadmin criado com sucesso!');
      console.log('Detalhes:');
      console.log(`- Nome: ${newSuperadmin.name}`);
      console.log(`- Email: ${newSuperadmin.email}`);
      console.log(`- Senha: superadmin123`);
    }

    console.log('\nAcesse o sistema com essas credenciais em /login');
  } catch (error) {
    console.error('Erro ao criar superadmin:', error);
  } finally {
    await sequelize.close();
  }
}

// Executar a função principal
createSuperAdmin();
