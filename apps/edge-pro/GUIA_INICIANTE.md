# 🎓 Guia para Iniciantes em Go

## 📖 **Se você NUNCA mexeu em Go, comece aqui!**

### ✅ **1. Go está instalado?**

```bash
go version
```

Deve mostrar algo como: `go version go1.25.3 darwin/arm64`

Se não mostrar, instale:
```bash
brew install go
```

---

## 🎯 **Entendendo o Básico**

### **Go vs Rust vs Python:**

| Conceito | Python | Rust | Go |
|----------|--------|------|-----|
| **Compilar** | ❌ Não precisa | ✅ `cargo build` | ✅ `go build` |
| **Dependências** | `pip install` | `cargo add` | `go get` |
| **Cross-compile** | ❌ Difícil | ⚠️ Complicado | ✅ TRIVIAL |
| **Tempo compile** | N/A | 🐌 2-5 min | ⚡ 5-10 seg |

---

## 🔨 **Como Compilar o Edge v2**

### **Passo 1: Baixar dependências**

```bash
cd /Volumes/DadosTiago/Dev/Tagment/apps/edge-v2

# Baixar todas as bibliotecas (automático)
go mod download
```

O que isso faz:
- Lê o arquivo `go.mod` (como `Cargo.toml` ou `requirements.txt`)
- Baixa todas as dependências
- Salva em cache local (~/.go)

### **Passo 2: Compilar para o Mac (testar localmente)**

```bash
# Compilar para Mac
go build -o bin/edge-mac cmd/edge/main.go

# Executar
./bin/edge-mac -debug
```

⚠️ **Nota:** Vai funcionar, mas GPIO não vai funcionar (você não tem pinos GPIO no Mac).

### **Passo 3: Compilar para Raspberry Pi (ARM)**

```bash
# Compilar para Raspberry Pi
GOOS=linux GOARCH=arm GOARM=7 go build -o bin/edge-arm cmd/edge/main.go
```

**O que cada parte significa:**
- `GOOS=linux` - Sistema operacional alvo (Linux)
- `GOARCH=arm` - Arquitetura alvo (ARM)
- `GOARM=7` - Versão ARM (ARMv7 para Raspberry Pi 3/4)
- `-o bin/edge-arm` - Nome do arquivo de saída
- `cmd/edge/main.go` - Arquivo principal

**Resultado:** Um binário ARM em `bin/edge-arm` (~10MB)

### **Passo 4: Ver o binário**

```bash
ls -lh bin/edge-arm
file bin/edge-arm
```

Deve mostrar:
```
bin/edge-arm: ELF 32-bit LSB executable, ARM, version 1 (SYSV)
```

---

## 📦 **Copiar para a Raspberry Pi**

### **Opção 1: Usando o Makefile (recomendado)**

```bash
# Deploy completo (copia + instala serviço)
make deploy

# Deploy rápido (só copia o binário)
make deploy-quick
```

### **Opção 2: Usando dev.sh (mais fácil)**

```bash
# Deploy completo
./dev.sh deploy

# Deploy rápido
./dev.sh quick

# Ver logs
./dev.sh logs

# Testar API
./dev.sh test
```

### **Opção 3: Manual (SCP)**

```bash
# Copiar binário
scp bin/edge-arm tagment@192.168.10.103:~/edge

# SSH na Pi
ssh tagment@192.168.10.103

# Na Pi, executar
chmod +x edge
./edge -debug
```

---

## 🧪 **Workflow Típico de Desenvolvimento**

### **Ciclo rápido (durante desenvolvimento):**

```bash
# 1. Editar código
# (edite os arquivos .go)

# 2. Build + Deploy rápido
./dev.sh quick

# 3. Ver logs
./dev.sh logs

# 4. Ctrl+C para sair dos logs

# Repetir!
```

### **Build completo (primeira vez ou mudança de config):**

```bash
# 1. Build
make build-pi

# 2. Deploy completo
make deploy

# 3. Ver logs
make logs
```

---

## 📝 **Estrutura de um Projeto Go**

```
edge-v2/
├── go.mod                 # Dependências (como Cargo.toml)
├── go.sum                 # Lock file (como Cargo.lock)
│
├── cmd/                   # Binários executáveis
│   └── edge/
│       └── main.go        # Entry point (função main())
│
├── internal/              # Código privado do projeto
│   ├── api/              # Pacote API
│   ├── mqtt/             # Pacote MQTT
│   └── ...
│
└── pkg/                   # Código reutilizável (public)
    └── logger/
```

**Conceitos importantes:**
- `cmd/` - Aplicações executáveis
- `internal/` - Código privado (não pode ser importado de fora)
- `pkg/` - Bibliotecas reutilizáveis (podem ser importadas)

---

## 🔍 **Comandos Go Essenciais**

### **Gerenciar dependências:**

```bash
# Baixar dependências
go mod download

# Adicionar uma dependência
go get github.com/alguma/biblioteca

# Remover dependências não usadas
go mod tidy

# Ver dependências
go list -m all
```

### **Build:**

```bash
# Compilar (cria executável no diretório atual)
go build

# Compilar para outro OS/Arch
GOOS=linux GOARCH=arm go build

# Compilar e executar (útil para testes rápidos)
go run cmd/edge/main.go

# Compilar otimizado (produção)
go build -ldflags="-s -w" -o bin/edge
```

**Flags úteis:**
- `-ldflags="-s -w"` - Remove símbolos de debug (binário menor)
- `-o arquivo` - Nome do arquivo de saída
- `-v` - Verbose (mostra o que está compilando)

### **Test:**

```bash
# Rodar todos os testes
go test ./...

# Rodar testes com verbose
go test -v ./...

# Rodar teste de um pacote específico
go test ./internal/mqtt
```

### **Format & Lint:**

```bash
# Formatar código (auto-fix)
go fmt ./...

# Verificar erros comuns
go vet ./...

# Limpar cache
go clean -cache
```

---

## 🎯 **Comparação Visual**

### **Python (não compila):**
```
Mac:
  ✏️  Edita código
  ▶️  python main.py
  
Pi:
  📦 Copia .py
  ▶️  python main.py
```

### **Rust (cross-compile complicado):**
```
Mac:
  ✏️  Edita código
  🔨 cargo build --target=arm... (5 min) 😫
  📦 Copia binário
  
Pi:
  ▶️  ./edge (roda)
```

### **Go (cross-compile TRIVIAL):**
```
Mac:
  ✏️  Edita código
  🔨 GOOS=linux GOARCH=arm go build (10 seg) ⚡
  📦 Copia binário
  
Pi:
  ▶️  ./edge (roda)
```

---

## 🚀 **Seu Primeiro Build**

### **Vamos fazer juntos!**

```bash
# 1. Ir para o projeto
cd /Volumes/DadosTiago/Dev/Tagment/apps/edge-v2

# 2. Ver o código (opcional)
cat cmd/edge/main.go | head -20

# 3. Baixar dependências
go mod download

# 4. Compilar para Mac (teste)
go build -o bin/edge-mac cmd/edge/main.go
ls -lh bin/edge-mac

# 5. Compilar para Pi
GOOS=linux GOARCH=arm GOARM=7 go build -o bin/edge-arm cmd/edge/main.go
ls -lh bin/edge-arm

# 6. Ver info do binário
file bin/edge-arm

# 7. (Opcional) Executar no Mac pra ver erros
./bin/edge-mac -debug
# Vai dar erro de GPIO, mas é normal! (não tem GPIO no Mac)
```

---

## 💡 **Dicas Importantes**

### ✅ **DO:**
- Use `./dev.sh` para tudo (é mais fácil)
- Compile sempre com `GOOS=linux GOARCH=arm` para a Pi
- Use `-debug` para ver logs detalhados
- Execute `go mod tidy` depois de adicionar/remover imports

### ❌ **DON'T:**
- Não edite `go.sum` manualmente
- Não commit binários (bin/) no git
- Não esqueça de parar o serviço antigo antes de testar

---

## 🆘 **Erros Comuns**

### **1. "package X is not in GOROOT"**
```bash
# Solução: Baixar dependências
go mod download
```

### **2. "cannot find package"**
```bash
# Solução: Adicionar o import correto no código
# Ou instalar a dependência
go get github.com/pacote/faltando
```

### **3. "binary was compiled for X but is running on Y"**
```bash
# Solução: Você compilou para Mac mas tentou rodar na Pi (ou vice-versa)
# Compile novamente com as flags corretas
GOOS=linux GOARCH=arm go build
```

### **4. "permission denied"**
```bash
# Solução: Dar permissão de execução
chmod +x bin/edge-arm
```

---

## 📚 **Próximos Passos**

Agora que você entendeu o básico:

1. ✅ Compilar o edge-v2
2. ✅ Copiar para a Pi
3. ✅ Testar
4. 📖 Ler `QUICKSTART.md` para uso avançado
5. 🏗️ Ler `ARCHITECTURE.md` para entender a arquitetura

---

## 🎓 **Quer Aprender Mais Go?**

### **Recursos recomendados:**
- 📖 [Tour of Go](https://tour.golang.org/) - Tutorial interativo oficial
- 📚 [Go by Example](https://gobyexample.com/) - Exemplos práticos
- 📺 [Aprenda Go](https://www.youtube.com/watch?v=YS4e4q9oBaU) - Vídeo tutorial

### **Livros (PT-BR):**
- "Programando em Go" - Caio Filipini
- "Go em Ação" - William Kennedy

---

**🎉 Agora você sabe o básico de Go! Bora compilar?**



