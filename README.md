# 🏷️ Granobox Plus

**Sistema de Etiquetas Ultra-Moderno e Mobile-First**

## 🎯 **Sobre o Projeto**

O **Granobox Plus** é uma evolução focada em **etiquetas**, transformando o sistema em uma solução **simples, intuitiva e profissional** para criação, gerenciamento e impressão de etiquetas.

### **Características Principais:**
- 🎨 **Interface Ultra-Moderna** com paleta Laranja + Preto + Cinza
- 📱 **Mobile-First** design para qualquer dispositivo
- 🔘 **Botões Rounded-Full** para experiência moderna
- 👥 **Para usuários não-técnicos** - simplicidade máxima
- 🏷️ **Foco total em etiquetas** - sem complexidades desnecessárias

## 🚀 **Funcionalidades**

### **Gestão de Etiquetas:**
- ✅ **Criar** novas etiquetas com wizard de 3 passos
- ✅ **Visualizar** todas as etiquetas em grid moderno
- ✅ **Editar** informações existentes
- ✅ **Imprimir** etiquetas individuais ou em lote
- ✅ **Buscar** e **filtrar** por tipo e nome

### **Tipos de Etiquetas:**
- 🧪 **Matéria Prima** - Ingredientes e componentes básicos
- 🔬 **Manipulados** - Produtos processados
- 📦 **Produtos** - Produtos finais e acabados

### **Sistema de Códigos:**
- 🔢 **Códigos amigáveis** de 6 caracteres (Letra-Número-Letra-Número-Letra-Número)
- 🎲 **Geração automática** de códigos únicos
- 📱 **QR Codes** para cada etiqueta
- 🏷️ **Lotes** com identificação única

## 🎨 **Design System**

### **Paleta de Cores:**
- **🟠 Laranja** - Ações principais e destaque
- **⚫ Preto** - Textos e elementos importantes  
- **🔘 Cinza** - Fundos e elementos secundários

### **Componentes:**
- **Botões** - `rounded-full` com sombras e hover effects
- **Cards** - `rounded-2xl` com bordas e sombras
- **Inputs** - `rounded-full` com focus rings laranja
- **Grids** - Responsivos e adaptativos

## 🛠️ **Tecnologias**

- **Frontend:** Next.js 14 + React + TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Heroicons
- **Database:** Prisma + PostgreSQL
- **Printing:** ZPL + ESC/POS support

## 📱 **Interface Mobile-First**

### **Características:**
- 📱 **Design responsivo** para todos os dispositivos
- 🔘 **Botões grandes** para fácil toque
- 📏 **Espaçamento generoso** para usabilidade
- 🎯 **Navegação intuitiva** com gestos simples
- 🖼️ **Cards grandes** para visualização clara

## 🚀 **Como Usar**

### **1. Criar Nova Etiqueta:**
1. Clique em **"Nova Etiqueta"** na página principal
2. Preencha as **Informações Básicas** (Passo 1)
3. Configure os **Detalhes** (Passo 2)
4. **Revise** e confirme (Passo 3)

### **2. Gerenciar Etiquetas:**
1. Acesse **"Minhas Etiquetas"**
2. Use **busca** e **filtros** para encontrar
3. **Imprima** ou **edite** conforme necessário

### **3. Imprimir:**
1. Selecione a etiqueta desejada
2. Clique em **"Imprimir"**
3. Configure a impressora se necessário
4. **Imprima** em lote ou individual

## 🔧 **Instalação**

```bash
# Clone o repositório
git clone https://github.com/RaroTecnologia/granobox-plus.git

# Entre na pasta
cd granobox-plus

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Execute o projeto
npm run dev
```

## 📁 **Estrutura do Projeto**

```
granobox-plus/
├── apps/
│   └── web/                    # Aplicação web principal
│       ├── app/               # Páginas Next.js
│       │   ├── page.tsx      # Página inicial
│       │   └── etiquetas/    # Sistema de etiquetas
│       ├── components/        # Componentes reutilizáveis
│       └── lib/              # Utilitários e configurações
├── print-agent/               # Agente de impressão local
└── README.md                  # Este arquivo
```

## 🎯 **Roadmap**

### **Fase 1 - MVP (Atual):**
- ✅ Interface ultra-moderna
- ✅ Sistema de etiquetas básico
- ✅ Wizard de criação
- ✅ Visualização e busca

### **Fase 2 - Funcionalidades:**
- 🚧 Sistema de impressão avançado
- 🚧 Templates de etiquetas
- 🚧 Relatórios e analytics
- 🚧 Integração com bancos de dados

### **Fase 3 - Avançado:**
- 📊 Dashboard de consultoria
- 🔗 Multi-estabelecimentos
- 📈 Benchmark e comparações
- 🤖 Automações inteligentes

## 🤝 **Contribuição**

1. **Fork** o projeto
2. Crie uma **branch** para sua feature
3. **Commit** suas mudanças
4. **Push** para a branch
5. Abra um **Pull Request**

## 📄 **Licença**

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 **Suporte**

- **Email:** suporte@rarotecnologia.com
- **Documentação:** [docs.granobox.com](https://docs.granobox.com)
- **Issues:** [GitHub Issues](https://github.com/RaroTecnologia/granobox-plus/issues)

---

**Desenvolvido com ❤️ pela [Raro Tecnologia](https://rarotecnologia.com)**

*Transformando a gestão de etiquetas em uma experiência simples e moderna*
