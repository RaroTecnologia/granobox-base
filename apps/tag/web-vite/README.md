# Granobox Tag - Web (Vite)

Versão web do Granobox Tag usando **React + Vite** em vez de Next.js.

## 🚀 Migração de Next.js para Vite

### Por que migramos?

- **Performance**: Vite é mais rápido para desenvolvimento
- **Simplicidade**: Configuração mais direta
- **Flexibilidade**: Melhor para projetos que crescerão para múltiplas plataformas
- **Build**: Processo de build mais rápido

### O que foi migrado?

✅ **ThemeContext** - Sistema de temas dark/light  
✅ **ThemeToggle** - Componente de alternância de tema  
✅ **LoginPage** - Página de login completa  
✅ **DashboardPage** - Dashboard principal com todas as funcionalidades  
✅ **Tailwind CSS** - Configuração idêntica ao projeto Next.js  
✅ **Phosphor Icons** - Todos os ícones  
✅ **Roteamento** - React Router DOM  
✅ **TypeScript** - Configuração completa  

### Estrutura do Projeto

```
src/
├── app/                    # Páginas da aplicação
│   ├── LoginPage.tsx      # Página de login
│   ├── DashboardPage.tsx  # Dashboard principal
│   ├── EtiquetasPage.tsx  # Página de etiquetas (placeholder)
│   ├── CadastrosPage.tsx  # Página de cadastros (placeholder)
│   ├── ConfiguracoesPage.tsx # Página de configurações (placeholder)
│   ├── NovaEtiquetaPage.tsx  # Nova etiqueta (placeholder)
│   ├── PreviewPage.tsx    # Preview (placeholder)
│   └── FilaPage.tsx       # Fila de impressão (placeholder)
├── components/             # Componentes reutilizáveis
│   └── ThemeToggle.tsx    # Toggle de tema
├── contexts/               # Contextos React
│   └── ThemeContext.tsx   # Contexto de tema
├── App.tsx                 # Componente principal com roteamento
├── main.tsx               # Ponto de entrada
└── index.css              # Estilos globais e Tailwind
```

## 🛠️ Tecnologias

- **React 18** - Framework principal
- **Vite** - Build tool e dev server
- **TypeScript** - Tipagem estática
- **Tailwind CSS** - Framework CSS utilitário
- **React Router DOM** - Roteamento
- **Phosphor Icons** - Biblioteca de ícones

## 📱 Funcionalidades

### ✅ Implementadas
- Sistema de temas (dark/light)
- Página de login responsiva
- Dashboard completo com estatísticas
- Navegação mobile-first
- Design system consistente

### 🚧 Em Desenvolvimento
- Página de etiquetas
- Página de cadastros
- Página de configurações
- Fluxo de nova etiqueta
- Preview de etiquetas
- Fila de impressão

## 🚀 Como Executar

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🎨 Design System

### Cores
- **Primary**: `#1DA154` (Verde)
- **Dark**: Escala de cinzas de `#fafafa` a `#0a0a0a`

### Tipografia
- **Fonte**: Manrope
- **Pesos**: 200, 300, 400, 500, 600, 700, 800

### Componentes
- **Botões**: `rounded-full` com hover effects
- **Cards**: Bordas arredondadas e sombras
- **Inputs**: Estilo consistente com ícones

## 📱 Responsividade

- **Mobile-first** design
- **Breakpoints** otimizados para dispositivos móveis
- **Touch-friendly** interfaces
- **Bottom navigation** para mobile

## 🔄 Próximos Passos

1. **Implementar páginas placeholder** com funcionalidades reais
2. **Adicionar autenticação** real
3. **Integrar com backend** (Nest.js futuro)
4. **Implementar PWA** features
5. **Preparar para React Native** (compartilhar lógica)

## 📚 Referências

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
