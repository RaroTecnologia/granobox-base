# Migração para v1.5 Print API

## 📋 O que mudou?

### ❌ Antes (v1)
```dart
// 1. Processar template localmente
final zpl = await tagmentService.processTemplate(templateId, data);

// 2. Enviar ZPL para impressora
final result = await websocketPrintService.print(printerId, zpl);
```

### ✅ Agora (v1.5)
```dart
// Backend faz tudo! Só enviar os dados
final result = await v15PrintProvider.printValidityLabel(
  printerId: 'edge-go-d7e2b4',
  templateId: templateId,
  copies: 5,
  labelData: data,
  productId: productId,
  validityDate: validityDate,
);
```

---

## 🚀 Como Usar

### 1. Adicionar o Provider

```dart
// Em main.dart ou onde você configura os providers
MultiProvider(
  providers: [
    // ... outros providers
    
    ChangeNotifierProvider(
      create: (context) {
        final authProvider = context.read<AuthProvider>();
        return V15PrintProvider(
          baseUrl: 'https://api.granobox.com',
          authToken: authProvider.token!,
        );
      },
    ),
  ],
  child: MyApp(),
)
```

### 2. Imprimir Etiqueta de Validade

```dart
import 'package:provider/provider.dart';
import '../providers/v15_print_provider.dart';

// Em sua tela/widget
final v15Provider = context.read<V15PrintProvider>();

final result = await v15Provider.printValidityLabel(
  printerId: 'edge-go-d7e2b4',
  templateId: '1c12926f-849b-4bd7-8a61-05036f39f443',
  copies: 5,
  labelData: {
    'produto': 'Manteiga',
    'marca': 'Laticínios São João',
    'dataManipulacao': '30/11/2025',
    'dataValidade': '30/12/2025',
    'qtdPeso': '500G',
    'responsavel': 'Tiago L',
    'armazenamento': 'Geladeira 1',
    'conservacao': 'ambiente',
  },
  productId: productId,
  validityDate: '2025-12-30',
  operationId: operationId,
  storageLocationId: storageLocationId,
  conservationType: 'refrigerado',
);

if (result.success) {
  print('✅ Impressão enviada! Job ID: ${result.jobId}');
  print('📋 Códigos criados: ${result.labelCodes}');
  // ['Q4A4C8', 'B2X9K1', 'M7P3F2', 'R8T5D9', 'K3N7H6']
} else {
  print('❌ Erro: ${result.message}');
}
```

### 3. Imprimir Rótulo Genérico

```dart
final result = await v15Provider.printGenericLabel(
  printerId: 'edge-go-d7e2b4',
  templateId: 'template-preco',
  copies: 10,
  labelData: {
    'produto': 'Manteiga',
    'preco': 'R\$ 15,00',
    'validade': '30/12/2025',
  },
);

if (result.success) {
  print('✅ 10 etiquetas enviadas!');
}
```

---

## 🎯 Exemplo Completo: Migrar Tela de Etiquetas

### Antes (v1)
```dart
Future<void> _imprimirEtiqueta() async {
  setState(() => _isLoading = true);

  try {
    // 1. Processar template
    final zpl = await tagmentPrintProvider.imprimirComTemplate(
      impressora: impressora,
      templateId: templateId,
      labelData: {
        'produto': _produto,
        'dataValidade': _dataValidade,
        // ...
      },
    );

    // 2. Enviar para impressora
    final result = await websocketPrintService.print(
      printerId: impressora.edgeAgentFingerprint,
      zpl: zpl,
    );

    if (result.success) {
      _showSuccess('Etiqueta impressa!');
    }
  } catch (e) {
    _showError('Erro: $e');
  } finally {
    setState(() => _isLoading = false);
  }
}
```

### Depois (v1.5)
```dart
Future<void> _imprimirEtiqueta() async {
  final v15Provider = context.read<V15PrintProvider>();

  final result = await v15Provider.printValidityLabel(
    printerId: impressora.edgeAgentFingerprint,
    templateId: templateId,
    copies: 1,
    labelData: {
      'produto': _produto,
      'dataManipulacao': _formatDate(DateTime.now()),
      'dataValidade': _formatDate(_dataValidade),
      'qtdPeso': _peso,
      'responsavel': _responsavel,
      'armazenamento': _local,
    },
    productId: _productId,
    validityDate: _dataValidade.toIso8601String(),
    storageLocationId: _localId,
    conservationType: _conservacao,
  );

  if (result.success) {
    _showSuccess('Etiqueta impressa! Código: ${result.labelCodes.first}');
  } else {
    _showError(result.message);
  }
}
```

---

## 📊 Comparação

| Aspecto | v1 | v1.5 |
|---------|-----|------|
| **Linhas de código** | ~50 | ~20 |
| **Chamadas API** | 2 (Tagment + Granobox) | 1 (Granobox) |
| **Processamento ZPL** | Flutter | Backend |
| **Geração de código** | Flutter | Backend |
| **API Key Tagment** | No Flutter (inseguro) | No backend (seguro) |
| **Rastreabilidade** | Manual | Automática |
| **Logs** | Parciais | Completos no backend |

---

## 🔄 Migração Gradual

Você pode migrar gradualmente:

1. **Manter v1 funcionando** - Não remova o código antigo ainda
2. **Testar v1.5 em paralelo** - Adicione opção de "usar nova API"
3. **Validar resultados** - Compare v1 vs v1.5
4. **Migrar 100%** - Quando tudo estiver ok, remova v1

```dart
// Exemplo de migração gradual
Future<void> _imprimir() async {
  if (_useNewApi) {
    return _imprimirV15();
  } else {
    return _imprimirV1();
  }
}
```

---

## ⚠️ Pontos de Atenção

### 1. Formato de Data
O backend espera ISO 8601 para `metadata`:

```dart
// ❌ Errado
validityDate: '30/12/2025'

// ✅ Correto
validityDate: DateTime(2025, 12, 30).toIso8601String()
// Resultado: '2025-12-30T00:00:00.000'
```

### 2. printerId
Pode ser:
- `edge-go-xxx` (fingerprint do Edge-Go)
- `uuid` (ID da impressora na tabela printers)

```dart
// Ambos funcionam
printerId: 'edge-go-d7e2b4'
printerId: '18cd2783-fb07-4c8c-8280-10693a3a3587'
```

### 3. Offsets
Use para ajustar posição:

```dart
offsets: {
  'x': 10,   // Move 10 pontos para direita
  'y': -5,   // Move 5 pontos para cima
}
```

---

## 🧪 Testando

```dart
// Em uma tela de teste
class TestV15Screen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final v15Provider = context.watch<V15PrintProvider>();

    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (v15Provider.isLoading)
              CircularProgressIndicator(),
            
            ElevatedButton(
              onPressed: () async {
                final result = await v15Provider.printValidityLabel(
                  printerId: 'edge-go-d7e2b4',
                  templateId: '1c12926f-849b-4bd7-8a61-05036f39f443',
                  copies: 3,
                  labelData: {
                    'produto': 'Teste',
                    'dataValidade': '30/12/2025',
                  },
                  productId: 'test-product-id',
                  validityDate: '2025-12-30',
                );

                if (result.success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('✅ Impresso! Códigos: ${result.labelCodes.join(', ')}'),
                    ),
                  );
                }
              },
              child: Text('Testar Impressão v1.5'),
            ),

            if (v15Provider.lastError != null)
              Text('Erro: ${v15Provider.lastError}'),
          ],
        ),
      ),
    );
  }
}
```

---

## 📚 Próximos Passos

1. ✅ Adicionar provider no app
2. 🧪 Testar impressão de validade
3. 🧪 Testar impressão de rótulos
4. 🔄 Migrar telas existentes
5. 🗑️ Remover código v1 antigo


