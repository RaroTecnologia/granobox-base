# GranoBox Control

Aplicação de controle e gerenciamento para o GranoBox, construída com React, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

### ✅ Implementado
- **Dashboard**: Visão geral com métricas e atividades recentes
- **Gerenciamento de Clientes**: CRUD completo de clientes com dados do Stripe
- **Sistema de Vouchers**: Criação e gerenciamento de vouchers de desconto
- **Layout Responsivo**: Sidebar com navegação e header com busca
- **Componentes UI**: Sistema de design consistente com Tailwind CSS

### 🔄 Em Desenvolvimento
- **Módulo de Cobrança**: Integração com Stripe para processamento de pagamentos
- **Sistema de Mensageria**: Email e WhatsApp Cloud API
- **Relatórios**: Analytics e relatórios detalhados
- **Configurações**: Painel de configurações do sistema

## 🛠️ Tecnologias

- **React 18** - Framework frontend
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **React Router DOM** - Roteamento
- **Tailwind CSS** - Framework CSS
- **Phosphor Icons** - Biblioteca de ícones
- **TanStack Query** - Gerenciamento de estado servidor (preparado)
- **Stripe** - Processamento de pagamentos (preparado)

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/           # Componentes base (Button, Card, Input)
│   └── layout/       # Layout components (Sidebar, Header, Layout)
├── pages/            # Páginas da aplicação
├── types/            # Definições TypeScript
├── hooks/            # Custom hooks (preparado)
├── services/         # Serviços de API (preparado)
└── utils/            # Utilitários (preparado)
```

## 🎨 Sistema de Design

A aplicação utiliza um sistema de design baseado em:
- **Cores**: Sistema de cores semânticas com suporte a tema claro/escuro
- **Tipografia**: Font Inter com pesos variados
- **Componentes**: Componentes reutilizáveis com variants
- **Espaçamento**: Sistema consistente de espaçamento
- **Ícones**: Phosphor Icons para consistência visual

## 🔗 Integrações Planejadas

### Stripe
- Processamento de pagamentos
- Gerenciamento de clientes
- Criação de faturas
- Webhooks para sincronização

### Email
- Templates responsivos
- Campanhas de marketing
- Automação de email
- Métricas de engajamento

### WhatsApp Cloud API
- Mensagens automatizadas
- Templates aprovados
- Chatbot básico
- Métricas de entrega

## 📊 Métricas e Analytics

- Dashboard com KPIs principais
- Relatórios de vendas
- Análise de uso de vouchers
- Métricas de engajamento
- Exportação de dados

## 🚀 Próximos Passos

1. **Implementar API Backend**: Criar endpoints para todas as funcionalidades
2. **Integração Stripe**: Configurar webhooks e processamento de pagamentos
3. **Sistema de Mensageria**: Implementar envio de email e WhatsApp
4. **Autenticação**: Sistema de login e permissões
5. **Testes**: Implementar testes unitários e de integração

## 🤝 Contribuição

Esta é uma aplicação interna do GranoBox. Para contribuir:

1. Crie uma branch para sua feature
2. Implemente as mudanças
3. Teste localmente
4. Abra um Pull Request

## 📝 Licença

Propriedade do GranoBox. Todos os direitos reservados.