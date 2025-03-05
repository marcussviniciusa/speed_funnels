'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Adicionar usuário de teste
    await queryInterface.bulkInsert('users', [{
      id: 1,
      name: 'Usuário Teste',
      email: 'teste@example.com',
      password: bcrypt.hashSync('senha123', 10),
      role: 'admin',
      last_login: new Date(),
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // Adicionar empresa de teste
    await queryInterface.bulkInsert('companies', [{
      id: 1,
      name: 'Empresa Teste',
      logo_url: 'https://via.placeholder.com/150',
      primary_color: '#2196f3',
      secondary_color: '#0d47a1',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    }], {});

    // Associar usuário à empresa
    await queryInterface.bulkInsert('user_companies', [{
      id: 1,
      user_id: 1,
      company_id: 1,
      role: 'admin',
      created_at: new Date(),
      updated_at: new Date()
    }], {});
  },

  async down (queryInterface, Sequelize) {
    // Remover associação
    await queryInterface.bulkDelete('user_companies', null, {});
    
    // Remover empresa
    await queryInterface.bulkDelete('companies', null, {});
    
    // Remover usuário
    await queryInterface.bulkDelete('users', null, {});
  }
};
