'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('api_connections', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: true, // Inicialmente permitimos nulos para compatibilidade com dados existentes
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    // Atualizar as conexões existentes para usar o ID do primeiro usuário
    const [users] = await queryInterface.sequelize.query(
      `SELECT id FROM users ORDER BY id LIMIT 1`
    );
    
    if (users.length > 0) {
      const userId = users[0].id;
      await queryInterface.sequelize.query(
        `UPDATE api_connections SET user_id = ${userId} WHERE user_id IS NULL`
      );
    }

    // Depois de atualizar os registros existentes, tornar a coluna não nula
    await queryInterface.changeColumn('api_connections', 'user_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('api_connections', 'user_id');
  }
};
