# 🖨️ Guia Simplificado - Respostas TCP das Impressoras

Este guia mostra como interpretar as respostas TCP das impressoras Zebra e C3TECH baseado nos estudos realizados.

## 🎯 Resumo Executivo

### Comando de Status
Todas as impressoras compatíveis respondem ao comando ZPL: `~HS`

### Padrões de Resposta por Marca

#### ✅ **Zebra (Todas)**
- **Formato**: `030,0,0,xxx,000` (linha única)
- **Sucesso**: Campo 1 = `030` + Campo 5 = `000`
- **Sem papel**: Campo 5 = `001`
- **Tampa aberta**: Campo 5 = `002` ou `150`
- **Sem ribbon**: Campo 2 = `1`

#### ✅ **C3TECH (Térmica Direta)**
- **Formato**: `150,0,0,xxx,000` (pode ter 2 linhas)
- **Sucesso**: Campo 1 = `150` + Campo 2 = `0`
- **Sem papel**: Campo 2 = `1`
- **Tampa aberta**: Linha 2, Campo 3 = `1`
- **Sem ribbon**: N/A (térmica direta)

---

## 🔍 Interpretação Prática

### 1. **Status de Sucesso**

```
Zebra:  "030,0,0,1234,000"  ✅ Tudo OK
C3TECH: "150,0,0,5678,000"  ✅ Tudo OK
```

### 2. **Sem Papel**

```
Zebra:  "030,0,0,1234,001"  ❌ Papel acabou
C3TECH: "150,1,0,5678,000"  ❌ Papel acabou
```

### 3. **Tampa Aberta**

```
Zebra:  "030,0,0,1234,002"  ❌ Tampa aberta
        ou "150,0,0,1234,000"
        
C3TECH: "150,0,0,5678,000"  ❌ Tampa aberta
        "xxx,x,1,xxxx,xxx"     (linha 2, campo 3)
```

### 4. **Sem Ribbon** (apenas Zebra)

```
Zebra:  "030,1,0,1234,000"  ❌ Ribbon acabou
C3TECH: N/A (térmica direta)
```

---

## 💻 Código de Exemplo

### Teste Básico TCP

```javascript
const net = require('net');

async function testarImpressora(ip, porta = 9100) {
  const socket = new net.Socket();
  
  return new Promise((resolve) => {
    socket.connect(porta, ip, () => {
      console.log(`✅ Conectado em ${ip}:${porta}`);
      
      // Enviar comando de status
      socket.write('~HS', (err) => {
        if (err) {
          console.error('❌ Erro ao enviar comando:', err);
          resolve({ success: false, error: err.message });
        }
      });
    });
    
    socket.on('data', (data) => {
      const response = data.toString().trim();
      console.log(`📥 Resposta: "${response}"`);
      
      // Interpretar resposta
      const status = interpretarStatus(response);
      socket.destroy();
      resolve({ success: true, status, raw: response });
    });
    
    socket.on('error', (err) => {
      console.error('❌ Erro TCP:', err.message);
      resolve({ success: false, error: err.message });
    });
  });
}

function interpretarStatus(response, marca = 'zebra') {
  const campos = response.split(',');
  
  if (marca.toLowerCase() === 'zebra') {
    return {
      online: campos[0] === '030',
      paperOut: campos[4] === '001',
      coverOpen: campos[4] === '002' || campos[0] === '150',
      ribbonOut: campos[1] === '1'
    };
  }
  
  if (marca.toLowerCase() === 'c3tech') {
    const linhas = response.split('\n');
    const linha1 = linhas[0].split(',');
    const linha2 = linhas[1]?.split(',') || [];
    
    return {
      online: linha1[0] === '150',
      paperOut: linha1[1] === '1',
      coverOpen: linha2[2] === '1',
      ribbonOut: false // térmica direta
    };
  }
}

// Uso
testarImpressora('192.168.1.100').then(console.log);
```

---

## 🚨 Códigos de Erro Comuns

### Zebra
| Código | Significado |
|--------|-------------|
| `000` | ✅ Tudo OK |
| `001` | ❌ Papel acabou |
| `002` | ❌ Tampa aberta |
| `004` | ❌ Ribbon acabou |
| `008` | ⚠️ Impressora pausada |
| `016` | ⚠️ Buffer cheio |
| `032` | ❌ Erro de comunicação |
| `150` | ❌ Tampa aberta (alternativo) |

### C3TECH
| Campo | Valor | Significado |
|-------|-------|-------------|
| Campo 1 | `150` | ✅ Online |
| Campo 2 | `0` | ✅ Papel OK |
| Campo 2 | `1` | ❌ Sem papel |
| Linha 2, Campo 3 | `0` | ✅ Tampa fechada |
| Linha 2, Campo 3 | `1` | ❌ Tampa aberta |

---

## 🛠️ Como Usar na Prática

### 1. **Teste de Conectividade**
```bash
# Testar se impressora responde na porta TCP
telnet 192.168.1.100 9100
```

### 2. **Envio de Comando Status**
```bash
# Dentro do telnet, digitar:
~HS
```

### 3. **Interpretação da Resposta**
- Anote a resposta completa
- Identifique a marca da impressora
- Use as tabelas acima para interpretar
- Implemente parser específico no código

### 4. **Teste de Cenários**
- ✅ Status normal (baseline)
- ❌ Remover papel e testar
- ❌ Abrir tampa e testar
- ❌ Remover ribbon (se aplicável)

---

## 📝 Notas Importantes

1. **Sempre testar cenários reais**: Não confie apenas na documentação
2. **Variações por modelo**: Alguns modelos podem ter pequenas diferenças
3. **Timeout**: Configure timeout de 10-15 segundos para comandos
4. **Encoding**: Respostas são em ASCII simples
5. **Conexão**: Uma conexão por comando (não reutilizar socket)

---

## 🔧 Troubleshooting

### Impressora não responde `~HS`
- Verificar se suporta ZPL
- Testar `~HI` ou `^XA^XZ`
- Consultar manual do fabricante

### Status sempre igual
- Impressora pode não reportar alguns estados
- Implementar parser genérico
- Documentar limitações

### Códigos inconsistentes
- Alguns modelos têm variações
- Implementar parser por modelo específico
- Adicionar fallbacks

---

## 📞 Referências

- **Código completo**: `api/src/printers/tcp-client.ts`
- **Testes**: `api/test-tcp.js`
- **Homologação**: `api/PRINTER_HOMOLOGATION_GUIDE.md`
