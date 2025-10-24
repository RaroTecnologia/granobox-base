# 🚀 Guia Rápido: Corrigir Travamento do Dot-Pi

## O Problema
Após 7 leituras consecutivas, o dot-pi travava completamente. ❌

## A Solução
Código corrigido na versão **v1.0.1** com 3 correções críticas:
1. ✅ Limite de goroutines simultâneas (máximo 3)
2. ✅ Fechamento correto de conexões HTTP
3. ✅ Buffer com limite de tamanho

---

## 📦 Atualizar via SSH

### Opção 1: Script Automático (RECOMENDADO)
```bash
# Conectar ao Orange Pi
ssh pi@192.168.10.233

# Ir para diretório
cd /home/pi/granobox/apps/dot-pi

# Puxar última versão
git pull

# Executar script de atualização
./update-and-restart.sh

# Pronto! ✅
```

### Opção 2: Manual
```bash
# Conectar ao Orange Pi
ssh pi@192.168.10.233

# Parar serviço
sudo systemctl stop granobox-dot

# Atualizar código
cd /home/pi/granobox/apps/dot-pi
git pull

# Recompilar
go build -o dot ./cmd/dot

# Reiniciar serviço
sudo systemctl start granobox-dot

# Ver logs
sudo journalctl -u granobox-dot -f
```

---

## 🧪 Como Testar

Após atualizar, faça **10 leituras consecutivas** sem parar:

```bash
# Acompanhar logs enquanto testa
sudo journalctl -u granobox-dot -f
```

**Resultado esperado:**
- ✅ Todas as 10+ leituras funcionam
- ✅ Não trava mais
- ✅ Logs mostram "Baixa registrada com sucesso!"
- ✅ Memória estável

---

## 📊 Verificar Versão

```bash
./dot
# Deve mostrar: Versão: 1.0.1
```

---

## 🐛 Se ainda travar...

Verificar logs detalhados:
```bash
sudo journalctl -u granobox-dot -n 100 --no-pager

# Verificar goroutines (se debug habilitado)
# Verificar memória
free -h

# Verificar file descriptors
lsof -p $(pgrep dot) | wc -l
```

---

## ✅ O que foi corrigido?

### 1. **Goroutines sem controle** → Semáforo (máx 3)
Antes: Criava goroutine ilimitada a cada leitura  
Depois: Máximo 3 consultas simultâneas

### 2. **HTTP Connection Leak** → Fecha sempre
Antes: Conexões ficavam abertas se houvesse erro  
Depois: SEMPRE fecha, mesmo com erro

### 3. **Buffer infinito** → Limite 256 chars
Antes: Buffer crescia infinitamente  
Depois: Máximo 256 caracteres, reseta se ultrapassar

---

## 💡 Dica Pro

Para monitorar em tempo real:
```bash
# Terminal 1: Logs
sudo journalctl -u granobox-dot -f

# Terminal 2: Recursos
watch -n 1 'ps aux | grep dot | head -1'
```

---

**Versão corrigida:** 1.0.1  
**Testado em:** Orange Pi Zero 2W  
**Data:** 24/10/2025

