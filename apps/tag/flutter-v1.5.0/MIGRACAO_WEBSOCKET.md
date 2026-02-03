# Migração para WebSocket-Only Print Service

## 📋 Visão Geral

Esta migração refatora o sistema de impressão do Flutter v1.5.0 para usar **APENAS WebSocket** através do endpoint `/edge-go-ws/print`, eliminando a complexidade do método híbrido (TCP + WebSocket).

## 🎯 Objetivos

1. **Simplificação**: Reduzir código de ~885 linhas para ~250 linhas
2. **Unificação**: Um único método de impressão (WebSocket)
3. **Manutenibilidade**: Código mais limpo e fácil de entender
4. **Confiabilidade**: Menos pontos de falha

## 📊 Comparativo

### Antes (HybridPrintService)
```
✅ Suportava TCP direto
✅ Suportava WebSocket via /mqtt/print
✅ Suportava WebSocket via /edge-go-ws/print
❌ 885 linhas de código
❌ Lógica complexa de detecção de tipo
❌ Múltiplos fallbacks
❌ Difícil de manter
```

### Depois (WebSocketPrintService)
```
✅ APENAS WebSocket via /edge-go-ws/print
✅ ~250 linhas de código
✅ Lógica simples e direta
✅ Um único fluxo de impressão
✅ Fácil de manter e testar
```

## 🔄 Mudanças nos Arquivos

### 1. Novo serviço criado
- **Arquivo**: `lib/services/websocket_print_service.dart`
- **Status**: ✅ Criado
- **Descrição**: Serviço limpo que usa apenas WebSocket

### 2. Arquivos a migrar

#### `lib/providers/tagment_print_provider.dart`
- **Mudança**: Substituir `HybridPrintService` por `WebSocketPrintService`
- **Complexidade**: Baixa
- **Impacto**: Médio

```dart
// ANTES
import '../services/hybrid_print_service.dart';
final service = HybridPrintService.instance;
await service.print(
  printer: printer,
  content: zpl,
  apiKey: apiKey,
  authToken: token,
  copies: copies,
);

// DEPOIS
import '../services/websocket_print_service.dart';
final service = WebSocketPrintService.instance;
await service.print(
  printer: printer,
  content: zpl,
  authToken: token,
  copies: copies,
);
```

#### `lib/screens/etiquetas_screen.dart`
- **Mudança**: Atualizar imports e chamadas
- **Complexidade**: Baixa
- **Impacto**: Baixo

#### `lib/components/printer_mode_selector.dart`
- **Mudança**: **REMOVER** - não é mais necessário selecionar modo
- **Complexidade**: Baixa
- **Impacto**: Baixo
- **Motivo**: Sem TCP direto, não há mais "modos" de impressão

#### `lib/screens/tagment_printers_config_screen.dart`
- **Mudança**: Remover referências ao seletor de modo
- **Complexidade**: Baixa
- **Impacto**: Baixo

### 3. Arquivo a depreciar (mas manter por enquanto)
- **Arquivo**: `lib/services/hybrid_print_service.dart`
- **Status**: ⚠️ Depreciar (mas não deletar ainda)
- **Motivo**: Permitir rollback se necessário

## 🚀 Plano de Migração

### Fase 1: Preparação ✅
- [x] Criar `WebSocketPrintService`
- [x] Documentar migração

### Fase 2: Migração do Provider
- [ ] Atualizar `tagment_print_provider.dart`
- [ ] Substituir chamadas ao `HybridPrintService`
- [ ] Remover lógica de detecção de modo
- [ ] Testar impressão

### Fase 3: Migração das Telas
- [ ] Atualizar `etiquetas_screen.dart`
- [ ] Remover `printer_mode_selector.dart`
- [ ] Atualizar `tagment_printers_config_screen.dart`
- [ ] Testar UI

### Fase 4: Limpeza
- [ ] Depreciar `hybrid_print_service.dart`
- [ ] Depreciar `printer_mode_service.dart`
- [ ] Atualizar documentação
- [ ] Remover imports não utilizados

## 🔑 API do WebSocketPrintService

### Método Principal

```dart
Future<TagmentPrintResult> print({
  required PrinterInfo printer,      // Informações da impressora
  required String content,            // ZPL a ser impresso
  required String authToken,          // Token de autenticação
  int copies = 1,                     // Número de cópias
  Function(String)? onProgress,       // Callback de progresso
})
```

### Requisitos

1. **printer.deviceId**: OBRIGATÓRIO - ID do device Edge-Go
2. **authToken**: OBRIGATÓRIO - Token de autenticação da API Granobox
3. **content**: OBRIGATÓRIO - ZPL válido

### Retorno

```dart
TagmentPrintResult:
  - success: true/false
  - message: String
  - jobId: String?
  - metadata: Map<String, dynamic>
```

## 📝 Exemplo de Uso

### Impressão Simples

```dart
final service = WebSocketPrintService.instance;

final result = await service.print(
  printer: selectedPrinter,
  content: zplContent,
  authToken: granoboxToken,
  copies: 2,
  onProgress: (msg) => print(msg),
);

if (result.success) {
  print('✅ Impresso: ${result.jobId}');
} else {
  print('❌ Erro: ${result.message}');
}
```

### Com Tratamento de Erro

```dart
try {
  final result = await service.print(
    printer: printer,
    content: zpl,
    authToken: token,
  );
  
  if (result.success) {
    // Sucesso
    showSnackbar('Etiqueta impressa com sucesso!');
  } else {
    // Erro controlado
    showErrorDialog(result.message);
  }
} catch (e) {
  // Erro não controlado
  showErrorDialog('Erro inesperado: $e');
}
```

## ⚠️ Pontos de Atenção

### 1. Todas as impressoras precisam de deviceId
- **Problema**: Impressoras antigas podem não ter deviceId
- **Solução**: Validação no backend deve garantir que todas as impressoras tenham deviceId

### 2. Sem fallback para TCP
- **Problema**: Se o WebSocket falhar, não há plano B
- **Solução**: Melhorar confiabilidade do WebSocket e do Edge-Go

### 3. Offsets continuam funcionando
- **Garantia**: Offsets X/Y são aplicados no ZPL antes de enviar
- **Método**: Usa `^LH` (Label Home) do ZPL

## 🧪 Testes Recomendados

### 1. Teste Básico
- Imprimir 1 etiqueta
- Verificar se imprimiu
- Verificar offsets

### 2. Teste de Múltiplas Cópias
- Imprimir 3 cópias
- Verificar se imprimiu todas

### 3. Teste de Erro
- Imprimir com impressora offline
- Verificar mensagem de erro
- Verificar que não travou o app

### 4. Teste de Offsets
- Configurar offsets X=5mm, Y=10mm
- Imprimir
- Verificar posicionamento

## 📚 Referências

- Endpoint: `POST /edge-go-ws/print`
- Documentação: `apps/api/src/modules/mqtt/mqtt.controller.ts`
- ZPL Reference: [Zebra Programming Guide](https://www.zebra.com/content/dam/zebra/manuals/printers/common/programming/zpl-zbi2-pm-en.pdf)

## 🎉 Benefícios

1. **Menos código**: ~635 linhas removidas
2. **Mais rápido**: Sem lógica de detecção/fallback
3. **Mais confiável**: Um único caminho, menos bugs
4. **Mais fácil**: Novo desenvolvedor entende em minutos
5. **Mais testável**: Menos mocks necessários

---

**Status**: 🚧 Em progresso
**Última atualização**: 30/11/2025
**Responsável**: Tiago (com assistência IA)


