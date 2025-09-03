# 🚀 Sistema de Auto-Update - Granobox Print Agent

## 📋 **Visão Geral**

O Granobox Print Agent agora possui um sistema de **auto-update** que permite aos usuários receberem atualizações automaticamente sem precisar reinstalar o aplicativo manualmente.

## ✨ **Funcionalidades**

- ✅ **Verificação automática** de atualizações na inicialização
- 🔄 **Verificação manual** via menu da bandeja do sistema
- 📥 **Download automático** de atualizações disponíveis
- 🚀 **Instalação automática** na próxima inicialização
- 🎯 **Notificações visuais** para o usuário
- 📱 **Interface web** com botão de verificação

## 🛠️ **Como Funciona**

### **1. Verificação Automática**
- O app verifica atualizações automaticamente 3 segundos após inicializar
- Verifica no repositório GitHub configurado
- Notifica o usuário se houver atualizações disponíveis

### **2. Verificação Manual**
- **Menu da bandeja**: Clique direito → "Verificar atualizações"
- **Interface web**: Botão "Verificar Atualizações" na barra de status
- **Atualização automática**: A cada inicialização do app

### **3. Processo de Atualização**
1. 🔍 **Verificação**: App verifica se há nova versão
2. 📥 **Download**: Se disponível, baixa automaticamente
3. 🔔 **Notificação**: Usuário é notificado que a atualização está pronta
4. 🚀 **Instalação**: App reinicia e instala a nova versão

## 🎯 **Para Desenvolvedores**

### **Publicar Nova Versão**

#### **Opção 1: Script Automatizado (Recomendado)**
```bash
# No diretório do projeto
./build-update.sh patch    # 0.1.0 -> 0.1.1
./build-update.sh minor    # 0.1.0 -> 0.2.0  
./build-update.sh major    # 0.1.0 -> 1.0.0
```

#### **Opção 2: Manual**
```bash
# 1. Atualizar versão
npm version patch --no-git-tag-version

# 2. Commit e tag
git add package.json
git commit -m "chore: bump version"
git tag -a "v0.1.1" -m "Release v0.1.1"

# 3. Push
git push origin main
git push origin "v0.1.1"

# 4. Build
npm run build

# 5. Criar release no GitHub
gh release create "v0.1.1" --title "v0.1.1" --notes "Release notes" dist/*
```

### **Pré-requisitos**
- ✅ GitHub CLI instalado (`gh`)
- ✅ Logado no GitHub (`gh auth login`)
- ✅ Acesso ao repositório `RaroTecnologia/granobox-tag`

## 🔧 **Configuração**

### **package.json**
```json
{
  "build": {
    "publish": [
      {
        "provider": "github",
        "owner": "RaroTecnologia",
        "repo": "granobox-tag"
      }
    ]
  }
}
```

### **main.js**
```javascript
const { autoUpdater } = require('electron-updater')

// Configurações
autoUpdater.autoDownload = false        // Não baixa automaticamente
autoUpdater.autoInstallOnAppQuit = true // Instala ao sair

// Eventos configurados
autoUpdater.on('update-available', ...)
autoUpdater.on('update-downloaded', ...)
autoUpdater.on('error', ...)
```

## 📱 **Para Usuários Finais**

### **Recebendo Atualizações**
1. **Automaticamente**: O app verifica na inicialização
2. **Manual**: Menu da bandeja → "Verificar atualizações"
3. **Interface web**: Botão "Verificar Atualizações"

### **Instalando Atualizações**
1. **Download automático** quando disponível
2. **Notificação** quando pronta para instalar
3. **Reiniciar agora** ou **mais tarde**
4. **Instalação automática** na próxima inicialização

## 🚨 **Troubleshooting**

### **Erro de Verificação**
- Verificar conexão com internet
- Verificar se o repositório GitHub está acessível
- Logs disponíveis no console do app

### **Erro de Download**
- Verificar espaço em disco
- Verificar permissões de escrita
- Verificar firewall/antivírus

### **Erro de Instalação**
- Verificar permissões de administrador
- Verificar se o app não está em uso
- Tentar reiniciar o computador

## 📊 **Logs e Debug**

### **Console do App**
```bash
# Verificar logs do Electron
# Os eventos de update aparecem no console
```

### **Arquivos de Log**
- Logs do sistema (macOS: Console.app)
- Logs do Electron (desenvolvedor)

## 🔮 **Próximas Melhorias**

- [ ] **Progress bar** durante download
- [ ] **Configuração** de frequência de verificação
- [ ] **Rollback** para versão anterior
- [ ] **Notificações** do sistema operacional
- [ ] **Cache** de atualizações
- [ ] **Delta updates** (só diferenças)

## 📞 **Suporte**

Para dúvidas ou problemas:
- 📧 Abrir issue no GitHub
- 💬 Contatar equipe de desenvolvimento
- 📚 Consultar esta documentação

---

**🎉 Sistema de Auto-Update implementado com sucesso!**
