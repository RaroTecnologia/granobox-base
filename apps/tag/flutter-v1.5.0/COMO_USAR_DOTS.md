# 📱 Como Usar o Sistema de Dots no App

## ✅ App Instalado no Tablet!

O app foi atualizado com o **sistema completo de gerenciamento de Dots**.

---

## 🚀 Como Adotar um Granobox Dot

### **1. Abrir Tela de Dots**

No app Tag:
1. Vá em **Configurações** (ícone de engrenagem)
2. Clique em **"Gerenciar Dots"**

### **2. Adotar Novo Dot**

Você verá 2 abas:

#### **Aba: "Adotar Novo Dot"**

**Passo a Passo:**

1. **Ligue o Granobox Dot** próximo ao tablet (< 10m)
   
2. **Clique em "Buscar Dots"**
   - Aguarde 5-10 segundos
   - Dots disponíveis aparecerão na lista
   
3. **Selecione o Dot** que deseja adotar

4. **Preencha o formulário:**
   - **Nome do Dot**: Ex: "Dot da Entrada", "Cozinha", etc (opcional)
   - **WiFi SSID**: Nome da sua rede WiFi (⚠️ apenas 2.4GHz!)
   - **Senha WiFi**: Senha da rede

5. **Clique em "Adotar Dot"**

6. **Aguarde o processo (30-40s):**
   ```
   ✓ Gerando API Key...
   ✓ Enviando configuração via BLE...
   ✓ Aguardando Dot conectar (10-15s)...
   ✓ Registrando Dot...
   ✅ Dot adotado com sucesso!
   ```

7. **Pronto!** O Dot foi automaticamente:
   - ✅ Configurado com WiFi
   - ✅ Recebeu API Key do backend
   - ✅ Conectou ao WiFi
   - ✅ Autenticou na API
   - ✅ Registrado no seu usuário

---

## 📊 Gerenciar Dots Adotados

#### **Aba: "Meus Dots"**

Aqui você vê todos os Dots que você adotou:

**Informações Exibidas:**
- 🟢 **Status**: Online (verde) ou Offline (laranja)
- 📱 **Device ID**: MAC address do Dot
- 📍 **IP Address**: IP atual na rede
- ⏰ **Último Acesso**: Tempo desde última conexão
- 📅 **Adotado em**: Data que você configurou

**Ações:**
- **Clique no Dot** para ver detalhes completos
- **Arraste para baixo** para atualizar (pull to refresh)
- **Botão Atualizar** no topo

---

## 🎯 O Que Cada Tela Faz

### **Adotar Novo Dot**
```
Buscar Dots
    ↓
[Lista de Dots encontrados]
    ↓
Clique em "Adotar"
    ↓
Preencha WiFi + Nome
    ↓
Sistema automático:
├── Gera API Key no backend
├── Envia config via BLE
├── Aguarda Dot conectar
└── Registra no banco
    ↓
✅ Dot pronto para usar!
```

### **Meus Dots (Lista)**
```
[Dot 1] 🟢 Online - Dot da Entrada
[Dot 2] 🟠 Offline - Cozinha
[Dot 3] 🟢 Online - Mesa 5
    ↓
Clique em qualquer Dot
    ↓
Ver detalhes completos
```

### **Detalhes do Dot**
```
Status: Online/Offline
Device ID: 88:13:BF:02:A7:A0 [📋 Copiar]
IP Address: 192.168.1.88
Último Acesso: 2 min atrás
Adotado em: 11/10/2025 14:42

━━━━━━━━━━━━━━━━━━━━━━━━

📥 Atualização OTA
   (Em desenvolvimento)
```

---

## 🔧 Funcionalidades Futuras (Preparadas)

Na tela de detalhes, em breve terá:

- ✏️ **Editar Nome** do Dot
- 🔑 **Regenerar API Key** (revoga a antiga)
- ⏸️ **Suspender Dot** (bloqueia acesso temporariamente)
- ▶️ **Reativar Dot** (desbloqueia)
- 📥 **Atualização OTA** do firmware
- 📊 **Estatísticas de uso**
- ⏰ **Agenda de horários** (ligar/desligar)

---

## ⚠️ Importante

### **WiFi**
- ✅ **Apenas redes 2.4GHz**
- ❌ Redes 5GHz NÃO funcionam (ESP32 não suporta)
- ✅ SSID e senha são case-sensitive

### **Bluetooth**
- ✅ Mantenha Bluetooth ligado
- ✅ Dot deve estar próximo (< 10m)
- ✅ Permissões de BLE concedidas

### **Conectividade**
- ✅ Aguarde 30-40s para adoção completa
- ✅ Dot leva 10-15s para conectar após configurar
- ✅ Se não aparecer online, aguarde mais um pouco

---

## 🐛 Problemas Comuns

### **"Nenhum Dot encontrado no scan"**
```
Soluções:
✅ Verifique se Bluetooth está ligado
✅ Dê permissões de localização/BLE ao app
✅ Ligue o Dot (deve estar em modo adoção)
✅ Aproxime o Dot do tablet
✅ Reinicie o Dot e tente novamente
```

### **"Dot não aparece online"**
```
Aguarde:
- 10-15s para conectar ao WiFi
- 5-10s para autenticar
- Até 30s total

Verifique:
✅ SSID e senha estão corretos
✅ WiFi é 2.4GHz
✅ Dot tem sinal WiFi
✅ Firewall não está bloqueando
```

### **"Erro ao adotar Dot"**
```
Tente:
1. Reinicie o Dot
2. Reinicie Bluetooth do tablet
3. Tente adotar novamente
4. Verifique logs do Serial Monitor (se possível)
```

---

## 🎉 Pronto para Usar!

O sistema está completo e funcional. Muito mais profissional que Serial Monitor!

**Teste agora:**
1. Abra o app no tablet
2. Vá em Configurações → Gerenciar Dots
3. Adote seu primeiro Dot
4. Veja ele aparecer na lista "Meus Dots"
5. Clique para ver detalhes

---

## 📝 Próximas Melhorias

Quando você quiser, posso adicionar:
- ✏️ Editar nome do Dot
- 🔑 Regenerar API Key via app
- ⏰ Configurar agenda de horários
- 📥 Atualização OTA do firmware
- 📊 Dashboard com estatísticas

