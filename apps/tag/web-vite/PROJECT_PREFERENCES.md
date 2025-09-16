# Preferências do Projeto - GranoBox Web-Vite

Este documento define as preferências e padrões de desenvolvimento para o projeto GranoBox Web-Vite.

## 🎨 Design e UX

### Interface
- **Design Flat**: Evitar gradientes e sombras excessivas
- **Paleta de Cores**: Verde (#1DA154), preto e cinza apenas - **NÃO usar outras cores**
- **Tipografia**: Inter como fonte principal
- **Ícones**: Phosphor Icons para consistência visual

### Navegação e Layout
- **Páginas ao invés de Modais**: Sempre que possível, preferir navegação para páginas dedicadas ao invés de modais
- **Footer Navigation**: Navegação principal no rodapé para mobile
- **Responsividade**: Design mobile-first
- **Conservação**: Não usar boxes coloridos, integrar com o layout existente

## 🏗️ Arquitetura

### Estrutura de Pastas
```
src/
├── components/
│   ├── ui/           # Componentes base reutilizáveis
│   ├── layout/       # Componentes de layout
│   └── forms/        # Formulários específicos
├── app/              # Páginas da aplicação
├── hooks/            # Custom hooks
├── services/         # Serviços de API
├── types/            # Definições TypeScript
├── contexts/         # Contextos React
└── utils/            # Utilitários
```

### Componentes
- **Componentes pequenos e focados**: Uma responsabilidade por componente
- **Props tipadas**: Sempre usar TypeScript para props
- **Reutilização**: Criar componentes base reutilizáveis na pasta `components/`

### Loading States
- **Componente padrão**: Usar `LoadingSpinner` para todos os estados de loading
- **Variações disponíveis**:
  - `<LoadingSpinner />` - Componente base configurável
  - `<PageLoading />` - Loading de página inteira (fullscreen)
  - `<SectionLoading />` - Loading de seção específica
  - `<InlineLoading />` - Loading inline sem texto
- **Tamanhos**: `sm`, `md`, `lg`, `xl`
- **Localização**: `/src/components/LoadingSpinner.tsx`
- **Uso obrigatório**: Sempre mostrar loading durante operações assíncronas
- **Texto personalizado**: Usar textos descritivos ("Carregando produtos...", "Salvando dados...")

### Confirmation Modals
- **Componente padrão**: Usar `ConfirmationModal` para todas as confirmações
- **Localização**: `/src/components/ConfirmationModal.tsx`
- **Tipos disponíveis**: `danger`, `warning`, `info`
- **Uso obrigatório**: NUNCA usar `window.confirm()` - sempre usar o modal
- **Props principais**:
  - `title`: Título do modal
  - `message`: Mensagem explicativa
  - `itemName`: Nome do item sendo afetado (destacado)
  - `confirmText`: Texto do botão de confirmação
  - `cancelText`: Texto do botão de cancelamento
  - `type`: Tipo visual (`danger` para exclusões)
- **Exemplo**: Exclusões, alterações importantes, ações irreversíveis

## 🔄 Fluxo de Trabalho

### Formulários
- **Páginas dedicadas**: Criar páginas separadas para formulários complexos
- **Validação**: Implementar validação client-side com feedback visual
- **Estados de loading**: Mostrar estados de carregamento durante operações
- **Confirmações**: Usar confirmações nativas do browser para ações destrutivas

### Navegação
- **URLs semânticas**: `/etiquetas/nova`, `/etiquetas/:id`
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
- **Footer Navigation**: Em mobile, navegação principal no rodapé
- **Cards responsivos**: Usar grid responsivo para listagens

## 🎯 Performance

### Otimizações
- **Lazy loading**: Carregar componentes sob demanda
- **Memoização**: Usar React.memo quando apropriado
- **Bundle splitting**: Dividir código por rotas

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
- **React Hot Toast**: Notificações
- **Axios**: Requisições HTTP

## 🚫 Evitar

### Padrões não recomendados
- **Cores não aprovadas**: Usar apenas verde, preto e cinza
- **Boxes coloridos**: Não usar containers com cores de fundo
- **Inline styles**: Usar classes Tailwind
- **Componentes gigantes**: Quebrar em componentes menores
- **Props drilling**: Usar Context quando necessário
- **Any types**: Sempre tipar adequadamente

### Bibliotecas não recomendadas
- **Moment.js**: Usar date-fns ou métodos nativos
- **Lodash**: Usar métodos nativos quando possível
- **jQuery**: Usar React puro
- **CSS-in-JS**: Usar Tailwind CSS

## 📋 Checklist de Desenvolvimento

Antes de implementar uma funcionalidade, verificar:

- [ ] Código está tipado corretamente
- [ ] Componentes são responsivos
- [ ] Loading states estão implementados
- [ ] Usa apenas cores aprovadas (verde, preto, cinza)
- [ ] Não há console.log esquecidos
- [ ] Formulários têm validação adequada
- [ ] Navegação funciona corretamente
- [ ] Design segue as preferências do projeto
- [ ] Código está formatado (Prettier)
- [ ] Não há warnings do ESLint

## 🎯 Objetivos

### Funcionalidades Principais
- Gestão completa de etiquetas de validade
- Integração com Tagment Agent Print
- Interface mobile-first
- Operações offline quando possível

### Integração
- API Granobox para dados
- Tagment API para impressão
- WebSocket para tempo real
- Local storage para cache

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0.0
