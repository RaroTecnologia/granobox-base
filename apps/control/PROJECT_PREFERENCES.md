# Preferências do Projeto - GranoBox Control

Este documento define as preferências e padrões de desenvolvimento para o projeto GranoBox Control.

## 🎨 Design e UX

### Interface
- **Design Flat**: Evitar gradientes e sombras excessivas
- **Paleta de Cores**: Usar o verde do GranoBox (#1DA154) como cor primária
- **Tipografia**: Inter como fonte principal
- **Ícones**: Phosphor Icons para consistência visual

### Navegação e Layout
- **Páginas ao invés de Modais**: Sempre que possível, preferir navegação para páginas dedicadas ao invés de modais
- **Breadcrumbs**: Implementar navegação hierárquica clara
- **Sidebar**: Manter navegação principal sempre visível
- **Responsividade**: Design mobile-first

## 🏗️ Arquitetura

### Estrutura de Pastas
```
src/
├── components/
│   ├── ui/           # Componentes base reutilizáveis
│   ├── layout/       # Componentes de layout
│   └── forms/        # Formulários específicos
├── pages/            # Páginas da aplicação
├── hooks/            # Custom hooks
├── services/         # Serviços de API
├── types/            # Definições TypeScript
└── utils/            # Utilitários
```

### Componentes
- **Componentes pequenos e focados**: Uma responsabilidade por componente
- **Props tipadas**: Sempre usar TypeScript para props
- **Reutilização**: Criar componentes base reutilizáveis na pasta `ui/`

## 🔄 Fluxo de Trabalho

### Formulários
- **Páginas dedicadas**: Criar páginas separadas para formulários complexos
- **Validação**: Implementar validação client-side com feedback visual
- **Estados de loading**: Mostrar estados de carregamento durante operações
- **Confirmações**: Usar confirmações nativas do browser para ações destrutivas

### Navegação
- **URLs semânticas**: `/clients/new`, `/clients/:id/edit`
- **Estado na URL**: Manter estado importante na URL quando possível
- **Navegação programática**: Usar React Router para navegação

### Estado
- **Estado local primeiro**: Usar useState para estado simples
- **Context quando necessário**: Para estado compartilhado entre componentes
- **Evitar over-engineering**: Não usar Redux/Zustand desnecessariamente

## 📱 Responsividade

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

### Comportamento
- **Mobile-first**: Desenvolver primeiro para mobile
- **Sidebar colapsível**: Em mobile, sidebar deve ser colapsível
- **Tabelas responsivas**: Usar scroll horizontal ou cards em mobile

## 🎯 Performance

### Otimizações
- **Lazy loading**: Carregar componentes sob demanda
- **Memoização**: Usar React.memo quando apropriado
- **Imagens otimizadas**: Usar formatos modernos (WebP, AVIF)
- **Bundle splitting**: Dividir código por rotas

## 🧪 Testes

### Estratégia
- **Testes de componente**: Testar comportamento, não implementação
- **Testes de integração**: Fluxos completos de usuário
- **Testes E2E**: Cenários críticos de negócio

## 📝 Documentação

### Código
- **Comentários em português**: Documentar lógica complexa
- **JSDoc**: Para funções utilitárias
- **README atualizado**: Manter instruções de setup atualizadas

### Commits
- **Conventional Commits**: Usar padrão de commits semânticos
- **Português**: Mensagens de commit em português
- **Escopo claro**: Indicar área afetada (feat(clients): adicionar formulário)

## 🔧 Ferramentas

### Desenvolvimento
- **Vite**: Build tool principal
- **TypeScript**: Tipagem estática obrigatória
- **Tailwind CSS**: Framework CSS principal
- **ESLint + Prettier**: Formatação e linting

### Bibliotecas Preferidas
- **React Router DOM**: Roteamento
- **React Hook Form**: Formulários complexos
- **Phosphor Icons**: Ícones
- **date-fns**: Manipulação de datas

## 🚫 Evitar

### Padrões não recomendados
- **Modais desnecessários**: Preferir páginas dedicadas
- **Inline styles**: Usar classes Tailwind
- **Componentes gigantes**: Quebrar em componentes menores
- **Props drilling**: Usar Context quando necessário
- **Any types**: Sempre tipar adequadamente

### Bibliotecas não recomendadas
- **Moment.js**: Usar date-fns
- **Lodash**: Usar métodos nativos quando possível
- **jQuery**: Usar React puro
- **CSS-in-JS**: Usar Tailwind CSS

## 📋 Checklist de PR

Antes de abrir um Pull Request, verificar:

- [ ] Código está tipado corretamente
- [ ] Componentes são responsivos
- [ ] Não há console.log esquecidos
- [ ] Formulários têm validação adequada
- [ ] Navegação funciona corretamente
- [ ] Design segue as preferências do projeto
- [ ] Código está formatado (Prettier)
- [ ] Não há warnings do ESLint

## 🎯 Objetivos

### Curto Prazo
- Interface limpa e funcional
- CRUD completo de todas entidades
- Integração com APIs existentes

### Longo Prazo
- PWA (Progressive Web App)
- Modo offline
- Sincronização automática
- Notificações push

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
