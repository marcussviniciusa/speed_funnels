# Documentação do Sistema de Autenticação do Speed Funnels

Este documento descreve o sistema de autenticação implementado no Speed Funnels, incluindo as correções e melhorias realizadas.

## Visão Geral

O sistema de autenticação do Speed Funnels utiliza:
- JWT (JSON Web Tokens) para autenticação stateless
- Bcrypt para hash seguro de senhas
- Middleware de autenticação para proteger rotas
- Controle de acesso baseado em funções (RBAC)

## Estrutura do Sistema

### Componentes Principais

1. **Controlador de Autenticação** (`src/controllers/auth.controller.js`)
   - Gerencia login e registro de usuários
   - Valida credenciais
   - Gera tokens JWT

2. **Modelo de Usuário** (`src/models/user.model.js`)
   - Define o esquema de usuário
   - Implementa hooks para hash de senha
   - Fornece método `validatePassword` para verificação segura

3. **Middleware de Autenticação** (`src/middlewares/auth.middleware.js`)
   - Verifica tokens JWT
   - Aplica controle de acesso baseado em funções

4. **Contexto de Autenticação no Frontend** (`client/src/contexts/AuthContext.js`)
   - Gerencia estado de autenticação
   - Armazena token JWT no localStorage
   - Fornece funções de login/logout

## Correções Implementadas

### 1. Correção do Controlador de Autenticação

O controlador de autenticação foi atualizado para:
- Usar o banco de dados em vez de um array estático de usuários
- Implementar validação de senha usando bcrypt
- Incluir informações de empresas associadas ao usuário

### 2. Correção de Variáveis de Ambiente

- Alterado `DB_PASS` para `DB_PASSWORD` para manter consistência

### 3. Scripts de Manutenção

Foram criados os seguintes scripts:
- `scripts/reset-admin-password.js`: Redefine a senha do usuário administrador
- `scripts/verify-login.js`: Verifica o funcionamento do login
- `scripts/check-admin-user.js`: Verifica a existência do usuário administrador

## Fluxo de Autenticação

1. **Login**:
   - Cliente envia email/senha para `/api/auth/login`
   - Servidor valida credenciais usando bcrypt
   - Se válido, gera token JWT e retorna com dados do usuário

2. **Autenticação de Requisições**:
   - Cliente inclui token JWT no header `Authorization`
   - Middleware verifica a validade do token
   - Se válido, adiciona informações do usuário ao objeto de requisição

3. **Logout**:
   - Cliente remove token JWT do localStorage
   - Reseta estado de autenticação no frontend

## Usuários e Funções

O sistema suporta três níveis de acesso:
- **superadmin**: Acesso completo ao sistema
- **admin**: Acesso administrativo com algumas restrições
- **user**: Acesso básico às funcionalidades

## Segurança

- Senhas armazenadas com hash usando bcrypt (10 rounds)
- Tokens JWT com expiração configurável
- Proteção contra CSRF através de tokens
- Validação de entrada em todas as rotas

## Manutenção e Solução de Problemas

### Redefinir Senha de Administrador

```bash
node scripts/reset-admin-password.js
```

### Verificar Login

```bash
node scripts/verify-login.js
```

### Verificar Usuário Administrador

```bash
node scripts/check-admin-user.js
```

## Melhorias Futuras

- Implementar autenticação de dois fatores (2FA)
- Adicionar limite de tentativas de login (proteção contra força bruta)
- Implementar rotação de tokens JWT
- Adicionar logs detalhados de atividades de autenticação
- Implementar recuperação de senha por email
