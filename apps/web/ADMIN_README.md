# 🏢 Sistema Administrativo Granobox

Este é o sistema administrativo do Granobox, responsável por gerenciar organizações clientes, planos de assinatura e usuários.

## 🚀 Funcionalidades

### 📋 Gestão de Organizações
- Cadastro de novas organizações (padarias, docerias, etc.)
- Visualização e edição de dados organizacionais
- Controle de status (ativa/inativa)
- Gerenciamento de domínios personalizados

### 💳 Gestão de Planos e Assinaturas
- Criação e configuração de planos
- Controle de assinaturas ativas
- Gestão de faturas e pagamentos
- Diferentes níveis de recursos por plano

### 👥 Gestão de Usuários
- Cadastro de usuários por organização
- Sistema de permissões granular
- Controle de acesso por recursos
- Histórico de acessos

### 📊 Relatórios e Analytics
- Dashboard com métricas principais
- Relatórios de receita
- Análise de uso por organização
- Indicadores de crescimento

## 🏗️ Arquitetura

### Estrutura de Dados
```
Organizacao
├── Usuario[]
├── Assinatura
│   ├── Plano
│   └── Fatura[]
├── ConfiguracaoOrganizacao
└── Dados do Negócio (multi-tenancy)
    ├── Ingrediente[]
    ├── Receita[]
    ├── Cliente[]
    ├── Pedido[]
    └── ...
```

### Planos Disponíveis
- **Básico**: R$ 49,90/mês - 2 usuários, 50 receitas
- **Profissional**: R$ 99,90/mês - 5 usuários, 200 receitas
- **Enterprise**: R$ 199,90/mês - 15 usuários, 1000 receitas

### Níveis de Permissão
- **Admin**: Acesso completo ao sistema
- **Gerente**: Acesso amplo, sem exclusões
- **Operador**: Acesso limitado à produção
- **Visualizador**: Apenas leitura

## 🛠️ Configuração

### 1. Instalar Dependências
```bash
npm install
```

### 2. Configurar Banco de Dados
```bash
# Gerar cliente Prisma
npm run db:generate

# Executar migrações
npm run db:migrate
```

### 3. Popular Dados Iniciais
```bash
# Executar seed administrativo
npm run seed:admin
```

### 4. Iniciar Desenvolvimento
```bash
npm run dev
```

## 📁 Estrutura de Arquivos

```
app/admin/
├── layout.tsx              # Layout administrativo
├── page.tsx                # Dashboard principal
├── organizacoes/
│   ├── page.tsx            # Lista de organizações
│   └── nova/
│       └── page.tsx        # Cadastro de organização
├── planos/
│   └── page.tsx            # Gestão de planos
├── usuarios/
│   └── page.tsx            # Gestão de usuários
└── relatorios/
    └── page.tsx            # Relatórios

components/
└── AdminNavigation.tsx     # Navegação administrativa

scripts/
└── seed-admin.js          # Script de seed administrativo
```

## 🔐 Autenticação e Segurança

### Middleware de Proteção
- Todas as rotas `/admin/*` são protegidas
- Verificação de permissões por recurso
- Controle de acesso baseado em organização

### Multi-tenancy
- Cada organização tem seus dados isolados
- Filtros automáticos por `organizacaoId`
- Domínios personalizados por organização

## 📱 Responsividade

O sistema administrativo é totalmente responsivo e funciona em:
- Desktop (1920px+)
- Tablet (768px - 1024px)
- Mobile (320px - 767px)

## 🎨 Design System

### Cores
- **Primary**: Indigo (#6366f1)
- **Success**: Green (#10b981)
- **Warning**: Yellow (#f59e0b)
- **Error**: Red (#ef4444)

### Componentes
- Cards informativos
- Tabelas responsivas
- Formulários validados
- Modais de confirmação
- Notificações toast

## 🚀 Deploy

### Variáveis de Ambiente
```env
DATABASE_URL="postgresql://..."
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
```

### Build de Produção
```bash
npm run build
npm start
```

## 📈 Próximos Passos

### Funcionalidades Planejadas
- [ ] Sistema de notificações
- [ ] Integração com gateway de pagamento
- [ ] API para integrações externas
- [ ] Sistema de backup automático
- [ ] Relatórios avançados
- [ ] Dashboard em tempo real

### Melhorias Técnicas
- [ ] Cache Redis para performance
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento e logs
- [ ] Documentação da API

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Suporte

Para dúvidas ou suporte:
- Email: admin@granobox.com
- Documentação: [docs.granobox.com](https://docs.granobox.com)
- Issues: [GitHub Issues](https://github.com/granobox/issues)

---

**Granobox** - Sistema completo para gestão de micro padarias 🥖 