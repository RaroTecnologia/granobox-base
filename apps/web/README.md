# Granobox - Sistema de Gestão para Micro Padarias

O Granobox é um MVP (Minimum Viable Product) de um sistema completo para gerenciamento de micro padarias, desenvolvido com Next.js, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

### ✅ Implementadas no MVP

- **Dashboard**: Visão geral com estatísticas e alertas
- **Receitas**: Cadastro e gerenciamento de receitas com ingredientes
- **Inventário**: Controle de estoque com alertas de estoque baixo
- **Produção**: Planejamento de produção com mapa de ingredientes
- **Clientes**: Cadastro e gerenciamento de clientes
- **PDV**: Ponto de venda com carrinho e finalização de vendas
- **Pedidos**: Gerenciamento de pedidos com controle de status

### 🔄 Principais Recursos

- **Gestão de Receitas**: Cadastre receitas com ingredientes, custos e preços
- **Controle de Estoque**: Monitore ingredientes com alertas automáticos
- **Planejamento de Produção**: O sistema calcula automaticamente os ingredientes necessários
- **PDV Intuitivo**: Interface simples para vendas no balcão
- **Gestão de Pedidos**: Controle completo do fluxo de pedidos
- **Dashboard Informativo**: Visão geral do negócio em tempo real

## 🛠️ Tecnologias Utilizadas

- **Next.js 14**: Framework React com App Router
- **TypeScript**: Tipagem estática para maior segurança
- **Tailwind CSS**: Framework CSS utilitário
- **Heroicons**: Ícones SVG
- **date-fns**: Manipulação de datas
- **UUID**: Geração de IDs únicos

## 📦 Instalação e Execução

1. **Clone o repositório**:
   ```bash
   git clone <url-do-repositorio>
   cd granobox
   ```

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Execute o projeto em modo de desenvolvimento**:
   ```bash
   npm run dev
   ```

4. **Acesse a aplicação**:
   Abra [http://localhost:3000](http://localhost:3000) no seu navegador

## 📁 Estrutura do Projeto

```
granobox/
├── app/                    # Páginas da aplicação (App Router)
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Dashboard
│   ├── receitas/          # Página de receitas
│   ├── inventario/        # Página de inventário
│   ├── producao/          # Página de produção
│   ├── clientes/          # Página de clientes
│   ├── pdv/              # Página do PDV
│   └── pedidos/          # Página de pedidos
├── components/            # Componentes reutilizáveis
│   └── Navigation.tsx     # Componente de navegação
├── lib/                   # Utilitários e dados
│   └── data.ts           # Sistema de dados mock
├── types/                 # Definições de tipos TypeScript
│   └── index.ts          # Tipos principais
└── ...                   # Arquivos de configuração
```

## 🎯 Como Usar

### 1. Dashboard
- Visualize estatísticas gerais da padaria
- Monitore alertas de estoque baixo
- Acompanhe pedidos recentes

### 2. Receitas
- Cadastre novas receitas com ingredientes
- Defina custos e preços de venda
- Calcule automaticamente a margem de lucro

### 3. Inventário
- Gerencie ingredientes e fornecedores
- Configure estoques mínimos
- Receba alertas automáticos de reposição

### 4. Produção
- Crie planos de produção diários
- O sistema calcula automaticamente os ingredientes necessários
- Verifique disponibilidade de estoque

### 5. PDV (Ponto de Venda)
- Adicione produtos ao carrinho
- Selecione clientes (opcional)
- Aplique descontos
- Finalize vendas com diferentes formas de pagamento

### 6. Pedidos
- Visualize todos os pedidos
- Atualize status dos pedidos
- Filtre por status e tipo
- Visualize detalhes completos

## 💾 Sistema de Dados

O MVP utiliza um sistema de dados em memória (mock) para demonstração. Os dados incluem:

- **Ingredientes**: Farinha, açúcar, ovos, manteiga, fermento
- **Receitas**: Pão francês, bolo de chocolate
- **Clientes**: Dados de exemplo
- **Pedidos**: Pedidos de demonstração

## 🔮 Próximas Funcionalidades

Para uma versão completa, considere implementar:

- **Banco de Dados**: PostgreSQL ou MongoDB
- **Autenticação**: Sistema de login e permissões
- **Relatórios**: Relatórios de vendas e financeiros
- **API**: Backend com Node.js ou Python
- **Mobile**: Aplicativo mobile para delivery
- **Integração**: APIs de pagamento e delivery
- **Backup**: Sistema de backup automático

## 🎨 Design System

O projeto utiliza um design system consistente:

- **Cores Primárias**: Tons de laranja (#f2811d)
- **Cores Secundárias**: Tons de azul (#0ea5e9)
- **Tipografia**: System fonts
- **Componentes**: Cards, botões, formulários padronizados

## 📱 Responsividade

A aplicação é totalmente responsiva e funciona em:
- Desktop (1024px+)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🤝 Contribuição

Este é um projeto MVP para demonstração. Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto é um MVP para fins educacionais e de demonstração.

---

**Granobox** - Transformando a gestão de micro padarias! 🥖✨ 