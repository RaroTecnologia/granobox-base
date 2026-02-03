import 'package:flutter/foundation.dart';
import '../services/legacy_print_service.dart';
import '../services/client_service.dart';
import '../services/websocket_print_service.dart'; // ⭐ DEPRECATED: Usar v1_5_print_service
import '../services/v1_5_print_service.dart'; // ⭐ NOVO: Impressão via API v1.5
import '../services/printer_edit_service.dart';
import '../services/printer_create_service.dart';
import '../services/granobox_printers_service.dart'; // ⭐ NOVO
import '../services/hybrid_print_service.dart'; // 🏷️ Para impressão personalizada
import '../models/print_result_models.dart';
import 'tagment_printer_config_provider.dart';
import '../services/granobox_api_service.dart';
import '../services/labels_service.dart';
import '../services/tcp_printer_status_service.dart';
// import '../services/printer_mode_service.dart'; // ⭐ REMOVIDO: Não é mais necessário
import '../providers/auth_provider.dart';
import '../config/app_config.dart';
import '../config/api_config.dart'; // Para baseUrl
import '../services/templates_service.dart'; // ⭐ NOVO: Para buscar template e verificar multi-coluna
import '../models/template_models.dart'; // ⭐ NOVO: Para TemplateLabelLayout
import 'package:provider/provider.dart';

/// Provider para gerenciar impressoras e impressão
class PrintProvider with ChangeNotifier {
  LegacyPrintService _printService;
  final ClientService _clientService = ClientService();
  final GranoboxPrintersService _granoboxPrintersService =
      GranoboxPrintersService(); // ⭐ NOVO
  TagmentPrinterConfigProvider? _printerConfigProvider;
  PrinterEditService? _editService;
  PrinterCreateService? _createService;

  PrintProvider({required LegacyPrintService printService})
    : _printService = printService;

  /// Definir o provider de configuração de impressoras
  void setPrinterConfigProvider(TagmentPrinterConfigProvider provider) {
    _printerConfigProvider = provider;
  }

  // Estado das impressoras
  List<PrinterInfo> _impressoras = [];
  bool _isLoading = false;
  String? _error;
  ApiKeyStatus? _apiKeyStatus;
  String? _currentApiKey;

  // Getters
  List<PrinterInfo> get impressoras => _impressoras;
  bool get isLoading => _isLoading;
  String? get error => _error;
  ApiKeyStatus? get apiKeyStatus => _apiKeyStatus;
  String? get apiKeyAtual => _currentApiKey;
  // Considerar configurado se há API Key (mesmo que a verificação de status falhe com 401)
  bool get isInitialized => _currentApiKey != null;

  // Impressoras filtradas por status
  List<PrinterInfo> get impressorasOnline =>
      _impressoras.where((p) => p.isOnline).toList();

  List<PrinterInfo> get impressorasValidade =>
      _impressoras.where((p) => p.isValidadePrinter && p.isOnline).toList();

  /// Configurar API Key automaticamente do cliente
  Future<bool> configurarApiKeyDoCliente(
    String clientId,
    String authToken,
  ) async {
    try {
      print('🔑 Buscando API Key do Tagment para o cliente...');
      print('   📋 Client ID: $clientId');
      print('   🔑 Auth Token: ${authToken.substring(0, 20)}...');
      // Log detalhado do endpoint
      print('   🌐 GET ${AppConfig.apiBaseUrl}/clients/$clientId');

      final apiKey = await _clientService.getTagmentApiKey(clientId, authToken);

      if (apiKey != null && apiKey.isNotEmpty) {
        print('✅ API Key encontrada: ${apiKey.substring(0, 10)}...');
        print('   📊 Tamanho da API Key: ${apiKey.length} caracteres');
        // Atualizar o serviço com a nova API Key
        _printService = LegacyPrintService(apiKey: apiKey);
        _currentApiKey = apiKey; // Salvar para uso posterior

        // Inicializar serviços de edição e criação
        _editService = PrinterEditService(apiKey: apiKey);
        _createService = PrinterCreateService(apiKey: apiKey);
        // Log de sanity check
        try {
          final status = await _printService.verificarStatus();
          print(
            '🔐 Status Tagment: valid=${status.isValid} tier=${status.tier} remaining=${status.remainingRequests} error=${status.error}',
          );
        } catch (e) {
          print('⚠️ Falha ao verificar status da API Key: $e');
        }

        return true;
      } else {
        print('❌ API Key do Tagment não configurada para este cliente');
        print('   📊 API Key retornada: $apiKey');
        // Tentativa de obter informações extras do cliente para diagnóstico
        try {
          final info = await _clientService.getClientInfo(clientId, authToken);
          print('   🔍 Client info recebido (campos relevantes):');
          print('     - businessName: ${info?['businessName']}');
          print('     - legalName: ${info?['legalName']}');
          print(
            '     - tagmentApiKey presente: ${info?['tagmentApiKey'] != null}',
          );
          print('     - tagmentCustomerId: ${info?['tagmentCustomerId']}');
        } catch (e) {
          print('   ⚠️ Falha ao obter client info p/ diagnóstico: $e');
        }
        return false;
      }
    } catch (e) {
      print('❌ Erro ao configurar API Key do cliente: $e');
      return false;
    }
  }

  /// Carregar impressoras da API
  /// ⭐ ATUALIZADO: Suporta filtro por operationId
  Future<void> carregarImpressoras({
    String? locationId,
    bool forceRefresh = false,
    String? operationId, // ⭐ NOVO: Filtrar por operação
    String? token, // ⭐ NOVO: Token Granobox
    String? clientId, // ⭐ NOVO: ClientId
  }) async {
    _setLoading(true);
    print(
      '🌀 carregarImpressoras(forceRefresh=$forceRefresh, locationId=$locationId, operationId=$operationId)',
    );
    _clearError();

    try {
      // ⭐ NOVO: Buscar impressoras APENAS do Granobox (dados completos)
      print(
        '🖨️ Carregando impressoras do Granobox... (forceRefresh: $forceRefresh)',
      );

      // Verificar se tem token e clientId
      if (token == null || clientId == null) {
        print('❌ Token ou ClientId não fornecido');
        _impressoras = [];
        notifyListeners();
        return;
      }

      print('🔑 Token presente, ClientId: $clientId');
      print('⏳ Chamando GranoboxPrintersService.getPrintersByOperation...');

      // Buscar impressoras do Granobox
      var impressoras = await _granoboxPrintersService.getPrintersByOperation(
        token: token,
        clientId: clientId,
        operationId: operationId, // Já filtra por operação automaticamente
      );

      print(
        '📦 Resposta recebida: ${impressoras.length} impressoras do Granobox',
      );

      _impressoras = impressoras;
      print('✅ ${impressoras.length} impressoras carregadas do Granobox');

      // Log das impressoras encontradas
      for (final impressora in impressoras) {
        print(
          '🖨️ ${impressora.displayName} - Status: ${impressora.status} - Connection: ${impressora.connection?.keys}',
        );
      }

      notifyListeners();
    } catch (e, stackTrace) {
      print('❌ Erro ao carregar impressoras: $e');
      print('📚 Stack trace: $stackTrace');
      _setError('Erro ao carregar impressoras: $e');
      _impressoras = []; // Garantir lista vazia em caso de erro
      notifyListeners();
    } finally {
      _setLoading(false);
      print('🏁 carregarImpressoras finalizado');
    }
  }

  /// Verificar status da API Key
  Future<void> verificarStatusAPI() async {
    try {
      print('🔑 Verificando status da API Key...');
      _apiKeyStatus = await _printService.verificarStatus();

      if (_apiKeyStatus!.isValid) {
        print(
          '✅ API Key válida - Tier: ${_apiKeyStatus!.tier} - Requests restantes: ${_apiKeyStatus!.remainingRequests}',
        );
      } else {
        print('⚠️ API Key com permissões limitadas: ${_apiKeyStatus!.error}');
        // Não falhar aqui, pois a API Key pode funcionar para impressão mesmo com status limitado
      }

      notifyListeners();
    } catch (e) {
      print('⚠️ Erro ao verificar status da API (pode ser normal): $e');
      // Criar status "funcional" mesmo com erro de verificação
      _apiKeyStatus = ApiKeyStatus.error(
        'Status não verificado (API Key funcional para impressão)',
      );
      notifyListeners();
    }
  }

  /// Obter impressora de validade para uma localização
  /// Regra:
  /// - Prioridade: Produto.defaultPrinterId → Categoria.defaultPrinterId → Config Manual → Tag 'validade' → Location → Primeira online
  /// - Se houver impressora configurada manualmente, retorna ela (sem exigir online)
  /// - Caso contrário, usa as online pela API; se houver locationId, prioriza mesma localização
  Future<PrinterInfo?> obterImpressoraValidade(
    String? locationId, {
    String? defaultPrinterId,
    String? categoryDefaultPrinterId,
  }) async {
    print('🔍 Buscando impressora de validade...');
    print('   📊 Total de impressoras: ${_impressoras.length}');
    print(
      '   🎯 Produto defaultPrinterId: ${defaultPrinterId ?? "não especificado"}',
    );
    print(
      '   📁 Categoria defaultPrinterId: ${categoryDefaultPrinterId ?? "não especificado"}',
    );
    print(
      '   🔧 Config Provider: ${_printerConfigProvider != null ? "OK" : "NULL"}',
    );
    print(
      '   🔧 Has Validade Printer: ${_printerConfigProvider?.hasValidadePrinter ?? false}',
    );

    for (final p in _impressoras) {
      print(
        '   🖨️ ${p.displayName} - Status: ${p.status} - Tags: ${p.tags} - isValidadePrinter: ${p.isValidadePrinter}',
      );
    }

    // ⭐ PRIORIDADE 1: Impressora do PRODUTO
    if (defaultPrinterId != null) {
      final impressoraProduto = _impressoras
          .where((p) => p.id == defaultPrinterId)
          .firstOrNull;
      if (impressoraProduto != null) {
        print(
          '   🎯 Usando impressora definida no PRODUTO: ${impressoraProduto.displayName}',
        );
        return impressoraProduto;
      }
    }

    // ⭐ PRIORIDADE 2: Impressora da CATEGORIA
    if (categoryDefaultPrinterId != null) {
      print('   🔍 Buscando impressora da categoria com ID: $categoryDefaultPrinterId');
      print('   📋 IDs disponíveis: ${_impressoras.map((p) => '${p.id} (${p.displayName})').join(', ')}');
      
      final impressoraCategoria = _impressoras
          .where((p) => p.id == categoryDefaultPrinterId)
          .firstOrNull;
      
      if (impressoraCategoria != null) {
        print(
          '   ✅ Impressora da CATEGORIA encontrada: ${impressoraCategoria.displayName} (ID: ${impressoraCategoria.id})',
        );
        return impressoraCategoria;
      } else {
        print(
          '   ⚠️ Impressora da CATEGORIA NÃO encontrada! ID procurado: $categoryDefaultPrinterId',
        );
        print('   📋 Continuando para próxima prioridade...');
      }
    } else {
      print('   ℹ️ Nenhuma impressora configurada na categoria');
    }

    // ⭐ PRIORIDADE 2.5: Impressora PADRÃO (isDefault: true) quando não há categoria
    if (categoryDefaultPrinterId == null) {
      final impressoraPadrao = _impressoras
          .where((p) => 
              p.isDefault == true && 
              (p.tags?.contains('validade') ?? false) &&
              p.isOnline)
          .firstOrNull;
      if (impressoraPadrao != null) {
        print(
          '   ⭐ Usando impressora PADRÃO (isDefault): ${impressoraPadrao.displayName}',
        );
        return impressoraPadrao;
      }
    }

    // PRIORIDADE 3: Configuração manual
    if (_printerConfigProvider != null &&
        _printerConfigProvider!.hasValidadePrinter) {
      print('   ✅ Tem configuração manual de impressora');
    } else {
      print('   ⚠️ SEM configuração manual - vai usar fallback');
    }

    if (_printerConfigProvider != null &&
        _printerConfigProvider!.hasValidadePrinter) {
      final validadePrinterId = _printerConfigProvider!.getValidadePrinterId();
      print('   🔧 Usando configuração manual - ID: $validadePrinterId');

      if (validadePrinterId != null) {
        final impressoraConfigurada = _impressoras
            .where((p) => p.id == validadePrinterId)
            .firstOrNull;

        if (impressoraConfigurada != null) {
          print(
            '   ✅ Impressora configurada encontrada: ${impressoraConfigurada.displayName}',
          );
          print('   📡 Status da API: ${impressoraConfigurada.status}');

          // Para impressoras TCP, verificar localmente se estão realmente online
          if (impressoraConfigurada.isTCPPrinter &&
              impressoraConfigurada.ip != null) {
            print(
              '   🔍 Testando conexão TCP local com ${impressoraConfigurada.ip}...',
            );
            try {
              final port =
                  impressoraConfigurada.connection?['port'] as int? ?? 9100;
              final isOnline = await TcpPrinterStatusService.instance.isOnline(
                host: impressoraConfigurada.ip!,
                port: port,
                timeout: const Duration(seconds: 3),
              );

              if (isOnline) {
                print(
                  '   ✅ Impressora TCP está online localmente (ignorando status da API)',
                );
                return impressoraConfigurada;
              } else {
                print('   ❌ Impressora TCP está offline localmente');
              }
            } catch (e) {
              print('   ⚠️ Erro ao testar conexão TCP: $e');
            }
          } else {
            // Para impressoras USB/Edge, confiar no status da API ou retornar sempre
            print('   ✅ Impressora USB/Edge - retornando sem verificação TCP');
            return impressoraConfigurada;
          }
        } else {
          print('   ⚠️ Impressora configurada não encontrada');
        }
      }
    }

    // 2. Fallback: usar qualquer impressora disponível
    print('   🔄 Buscando impressoras disponíveis...');

    // ⭐ SIMPLIFICADO: Para WebSocket, confiar no status da API
    final impressorasDisponiveis = _impressoras.where((impressora) {
      // Se tem edgeAgentFingerprint, é Edge-Go (WebSocket)
      if (impressora.edgeAgentFingerprint != null && impressora.edgeAgentFingerprint!.isNotEmpty) {
        if (impressora.isOnline) {
          print('   ✅ ${impressora.displayName} - Edge-Go online');
          return true;
        } else {
          print('   ⏭️ ${impressora.displayName} - Edge-Go offline');
          return false;
        }
      }
      
      // Para impressoras TCP legacy (se houver)
      if (impressora.isTCPPrinter && impressora.ip != null && impressora.isOnline) {
        print('   ✅ ${impressora.displayName} - TCP online');
        return true;
      }
      
      print('   ⏭️ ${impressora.displayName} - não disponível');
      return false;
    }).toList();

    print(
      '   📊 Impressoras disponíveis após verificação: ${impressorasDisponiveis.length}',
    );

    if (impressorasDisponiveis.isEmpty) {
      print('   ❌ Nenhuma impressora disponível');
      return null;
    }

    final impressorasOnline = impressorasDisponiveis;

    // Buscar por localização específica primeiro
    if (locationId != null) {
      final impressoraLocal = impressorasOnline
          .where((p) => p.location == locationId)
          .firstOrNull;
      if (impressoraLocal != null) {
        print(
          '   ✅ Usando impressora para localização: ${impressoraLocal.displayName}',
        );
        return impressoraLocal;
      }
    }

    // Priorizar impressora padrão (isDefault) antes do fallback final
    final impressoraPadrao = impressorasOnline
        .where((p) => p.isDefault == true)
        .firstOrNull;
    if (impressoraPadrao != null) {
      print('   ⭐ Usando impressora PADRÃO (isDefault): ${impressoraPadrao.displayName}');
      return impressoraPadrao;
    }

    // Fallback final: primeira impressora online disponível
    final impressora = impressorasOnline.first;
    print('   ✅ Usando impressora online: ${impressora.displayName}');
    return impressora;
  }

  /// Obter IP da impressora de validade para uma localização
  Future<String?> obterIPImpressoraValidade(
    String? locationId, {
    String? defaultPrinterId,
    String? categoryDefaultPrinterId,
  }) async {
    final impressora = await obterImpressoraValidade(
      locationId,
      defaultPrinterId: defaultPrinterId,
      categoryDefaultPrinterId: categoryDefaultPrinterId,
    );
    return impressora?.ip;
  }

  /// Obter impressora de rótulo (busca por tag 'rotulo' ou nome contendo "rotulo")
  Future<PrinterInfo?> obterImpressoraRotulo({String? locationId}) async {
    print('🔍 Buscando impressora de rótulo...');
    print('   📊 Total de impressoras: ${_impressoras.length}');

    // Buscar impressora com tag 'rotulo' ou nome contendo "rotulo"
    print('   🔄 Buscando impressoras com tag rotulo...');

    for (final impressora in _impressoras) {
      final hasRotuloTag =
          impressora.tags?.contains('rotulo') == true ||
          impressora.tags?.contains('rótulo') == true ||
          impressora.displayName.toLowerCase().contains('rotulo') ||
          impressora.displayName.toLowerCase().contains('rótulo');

      if (hasRotuloTag) {
        if (impressora.isOnline) {
          print('   ✅ Impressora de rótulo online: ${impressora.displayName}');
          return impressora;
        } else if (impressora.isTCPPrinter && impressora.ip != null) {
          // Testar TCP
          try {
            final port = impressora.connection?['port'] as int? ?? 9100;
            final isOnline = await TcpPrinterStatusService.instance.isOnline(
              host: impressora.ip!,
              port: port,
              timeout: const Duration(seconds: 3),
            );

            if (isOnline) {
              print(
                '   ✅ Impressora de rótulo online localmente: ${impressora.displayName}',
              );
              return impressora;
            }
          } catch (e) {
            print('   ⚠️ Erro ao testar TCP: $e');
          }
        }
      }
    }

    print('   ❌ Nenhuma impressora de rótulo disponível');
    return null;
  }

  /// Obter offsets da impressora (se configurados)
  Map<String, double> obterOffsetsImpressora(PrinterInfo? printerInfo) {
    if (printerInfo == null) {
      print('🔧 Nenhuma impressora informada - usando offsets padrão (0,0)');
      return {'x': 0.0, 'y': 0.0};
    }

    print('🔧 Analisando offsets da impressora ${printerInfo.displayName}...');
    print('🔧 PrinterInfo completa: ${printerInfo.toJson()}');
    print('🔧 offsetX raw: ${printerInfo.offsetX} (tipo: ${printerInfo.offsetX.runtimeType})');
    print('🔧 offsetY raw: ${printerInfo.offsetY} (tipo: ${printerInfo.offsetY.runtimeType})');

    // Primeiro, verificar se há offsets como campos diretos da impressora (como na API Tagment)
    if (printerInfo.offsetX != null || printerInfo.offsetY != null) {
      final x = printerInfo.offsetX ?? 0.0;
      final y = printerInfo.offsetY ?? 0.0;
      print('✅ Offsets encontrados como campos diretos: X=${x}mm, Y=${y}mm');
      return {'x': x, 'y': y};
    }

    // Verificar se há offsets no campo capabilities
    if (printerInfo.capabilities != null) {
      final capabilities = printerInfo.capabilities!;

      // Verificar campos comuns de offset
      final capOffsetX =
          capabilities['offsetX'] ??
          capabilities['offset_x'] ??
          capabilities['xOffset'] ??
          capabilities['x_offset'];
      final capOffsetY =
          capabilities['offsetY'] ??
          capabilities['offset_y'] ??
          capabilities['yOffset'] ??
          capabilities['y_offset'];

      if (capOffsetX != null || capOffsetY != null) {
        final x = capOffsetX != null
            ? double.tryParse(capOffsetX.toString()) ?? 0.0
            : 0.0;
        final y = capOffsetY != null
            ? double.tryParse(capOffsetY.toString()) ?? 0.0
            : 0.0;
        print('✅ Offsets encontrados nas capabilities: X=${x}mm, Y=${y}mm');
        return {'x': x, 'y': y};
      }
    }

    // Verificar se há offsets no campo connection
    if (printerInfo.connection != null) {
      final connection = printerInfo.connection!;

      final connOffsetX =
          connection['offsetX'] ??
          connection['offset_x'] ??
          connection['xOffset'] ??
          connection['x_offset'];
      final connOffsetY =
          connection['offsetY'] ??
          connection['offset_y'] ??
          connection['yOffset'] ??
          connection['y_offset'];

      if (connOffsetX != null || connOffsetY != null) {
        final x = connOffsetX != null
            ? double.tryParse(connOffsetX.toString()) ?? 0.0
            : 0.0;
        final y = connOffsetY != null
            ? double.tryParse(connOffsetY.toString()) ?? 0.0
            : 0.0;
        print('✅ Offsets encontrados na connection: X=${x}mm, Y=${y}mm');
        return {'x': x, 'y': y};
      }
    }

    print('⚠️ Nenhum offset encontrado - usando padrão (0,0)');
    return {'x': 0.0, 'y': 0.0};
  }

  /// Testar impressora
  Future<TagmentPrintResult> testarImpressora({
    required String printerIP,
    int printerPort = 9100,
    int timeout = 10000,
  }) async {
    try {
      print('🖨️ Testando impressora: $printerIP:$printerPort');

      final result = await _printService.testarImpressora(
        printerIP: printerIP,
        printerPort: printerPort,
        timeout: timeout,
      );

      if (result.success) {
        print('✅ Teste de impressora realizado com sucesso!');
      } else {
        print('❌ Erro no teste de impressora: ${result.message}');
      }

      return result;
    } catch (e) {
      print('❌ Erro ao testar impressora: $e');
      return TagmentPrintResult.error('Erro ao testar impressora: $e', null);
    }
  }

  /// Testar impressora com ZPL simples
  Future<TagmentPrintResult> testarImpressoraComZPL({
    required String printerIP,
    int printerPort = 9100,
    int timeout = 10000,
  }) async {
    try {
      print('🖨️ Testando impressora com ZPL simples: $printerIP:$printerPort');

      final result = await _printService.testarImpressora(
        printerIP: printerIP,
        printerPort: printerPort,
        timeout: timeout,
      );

      if (result.success) {
        print('✅ Teste com ZPL realizado com sucesso!');
      } else {
        print('❌ Erro no teste com ZPL: ${result.message}');
      }

      return result;
    } catch (e) {
      print('❌ Erro ao testar impressora com ZPL: $e');
      return TagmentPrintResult.error(
        'Erro ao testar impressora com ZPL: $e',
        null,
      );
    }
  }

  /// Imprimir etiqueta de validade
  Future<TagmentPrintResult> imprimirEtiquetaValidade({
    required String produto,
    required String marca,
    required String sif,
    required String dataEmbalagem,
    required String dataManipulacao,
    required String dataValidade,
    required String printerIP,
    int printerPort = 9100,
    double offsetX = 0.0,
    double offsetY = 0.0,
    PrinterInfo? printerInfo,
    // Novos campos adicionais
    String qtdPeso = '',
    String responsavel = '',
    String armazenamento = '',
    String labelValidade = '',
    int copies = 1,
    String? templateId, // Opcional: template customizado (produto)
    String? categoryDefaultTemplateId, // ⭐ NOVO: Template padrão da categoria
    String? clientId, // Para fallback dinâmico
    String? authToken, // Para autenticar na API ao buscar fallback
    String? codigo, // Código para QR/Template {{codigo}}
    String? productId, // Produto para registro da etiqueta
    String? storageLocationId, // Local de armazenagem da etiqueta
    String? conservacao, // 'ambiente' | 'refrigerado' | 'congelado'
    bool reimpressao = false, // true: reutiliza o código existente
    String? loteIndustria, // Lote da indústria
    String? dataVencimentoIndustria, // Data de vencimento da indústria
    Function(String)? onProgress, // ⭐ NOVO: Callback de progresso
  }) async {
    try {
      print('🖨️ ===== INICIANDO IMPRESSÃO DE ETIQUETA DE VALIDADE =====');
      // ⚠️ REMOVIDO: Pré-flight TCP - agora tudo é WebSocket
      // WebSocket não precisa de verificação prévia de conexão
      
      print('📦 Produto: $produto');
      print('🏷️ Marca: $marca');
      print('🔢 SIF: $sif');
      print('📅 Data Embalagem: $dataEmbalagem');
      print('📅 Data Manipulação: $dataManipulacao');
      print('📅 Data Validade: $dataValidade');
      print('⚖️ Qtd/Peso: $qtdPeso');
      print('👤 Responsável: $responsavel');
      print('🏢 Armazenamento: $armazenamento');
      print('🏷️ Label Validade: $labelValidade');
      print('📄 Cópias: $copies');
      print('🔍 DEBUG - Cópias recebidas no provider: $copies');
      print('🖨️ Impressora: $printerIP:$printerPort');
      print('📊 Offsets: X=${offsetX}, Y=${offsetY}');

      // 1..N: Criar e imprimir uma etiqueta por cópia (código único em cada)
      String _toIsoDate(String value) {
        if (value.isEmpty)
          return DateTime.now().toIso8601String().split('T')[0];
        final parts = value.split(' ');
        final datePart = parts.first;
        if (datePart.contains('/')) {
          final dp = datePart.split('/');
          if (dp.length == 3) {
            final d = dp[0].padLeft(2, '0');
            final m = dp[1].padLeft(2, '0');
            final y = dp[2];
            return '$y-$m-$d';
          }
        }
        try {
          final dt = DateTime.parse(datePart);
          return dt.toIso8601String().split('T')[0];
        } catch (_) {
          return DateTime.now().toIso8601String().split('T')[0];
        }
      }

      // ⭐ Selecionar template seguindo hierarquia: produto > categoria > cliente > fallback GranoBox
      String? effectiveTemplateId;
      
      // 1. Template do PRODUTO (customTemplateId)
      if (templateId != null && templateId.isNotEmpty) {
        effectiveTemplateId = templateId;
        print('🧩 Template do PRODUTO: $effectiveTemplateId');
      }
      
      // 2. Template da CATEGORIA (defaultTemplateId)
      if (effectiveTemplateId == null && categoryDefaultTemplateId != null && categoryDefaultTemplateId.isNotEmpty) {
        effectiveTemplateId = categoryDefaultTemplateId;
        print('🧩 Template da CATEGORIA: $effectiveTemplateId');
      }
      
      print('🔍 [DEBUG] Antes de buscar template do cliente:');
      print('   - effectiveTemplateId: $effectiveTemplateId');
      print('   - clientId: $clientId');
      print('   - authToken presente: ${authToken != null && authToken.isNotEmpty}');
      
      // 3. Template padrão do CLIENTE
      if (effectiveTemplateId == null && clientId != null) {
        try {
          print('🔍 [DEBUG] Buscando template padrão do cliente...');
          print('   - Client ID: $clientId');
          print('   - Label Type: validity');
          print('   - Auth Token presente: ${authToken != null && authToken.isNotEmpty}');
          
          final api = GranoboxApiService();
          final assocTemplateId = await api.getDefaultTemplateId(
            clientId: clientId,
            labelType: 'validity',
            authToken: authToken,
          );
          
          print('🔍 [DEBUG] Resposta da API: ${assocTemplateId ?? 'null (não encontrado)'}');
          
          effectiveTemplateId = assocTemplateId;
          print(
            '🧩 Template padrão do CLIENTE: ${effectiveTemplateId ?? 'não configurado'}',
          );
        } catch (e, stackTrace) {
          print('⚠️ Falha ao buscar template padrão do cliente: $e');
          print('   Stack trace: $stackTrace');
        }
      }
      
      // 4. Fallback: Template GranoBox padrão
      effectiveTemplateId ??= '1c12926f-849b-4bd7-8a61-05036f39f443';
      print('🧩 Template final selecionado: $effectiveTemplateId');

      // Buscar UUID do logo do cliente (se disponível)
      String? logoUuid;
      try {
        if ((clientId != null && clientId.isNotEmpty) &&
            (authToken != null && authToken.isNotEmpty)) {
          final clientInfo = await _clientService.getClientInfo(
            clientId,
            authToken,
          );
          logoUuid = clientInfo?['tagmentLogoUuid']?.toString();
          if (logoUuid != null && logoUuid!.isNotEmpty) {
            print('🖼️ Logo UUID do cliente: $logoUuid');
          } else {
            print('⚠️ Logo UUID do cliente não configurado');
          }
        }
      } catch (e) {
        print('⚠️ Falha ao obter logo do cliente: $e');
      }

      // DEBUG: Logar requisição do batch antes do POST
      final Map<String, dynamic> _debugBatchBody = {
        'type': 'validity',
        'conservationType': conservacao,
        'clientId': clientId ?? '',
        if (productId != null && productId.isNotEmpty) 'productId': productId,
        if (storageLocationId != null && storageLocationId.isNotEmpty)
          'storageLocationId': storageLocationId,
        'quantity': copies,
        'productionDate': _toIsoDate(dataManipulacao),
        'validityDate': _toIsoDate(dataValidade),
        'metadata': {
          'produto': produto,
          'marca': marca,
          'conservacao': conservacao,
          'responsavel': _formatarNomeOperador(responsavel),
          if (logoUuid != null && logoUuid!.isNotEmpty) 'logo': logoUuid,
        },
      };
      try {
        print(
          '🧪 [Batch Debug] templateId=$effectiveTemplateId copies=$copies',
        );
        print('🧪 [Batch Debug] body=' + _debugBatchBody.toString());
      } catch (_) {}

      // ⭐ NOVA ARQUITETURA v1.5: Backend cria etiquetas, processa templates e envia para Edge-Go
      print('🚀 [v1.5] Iniciando impressão via novo endpoint...');
      print('   Impressora: ${printerInfo!.displayName}');
      print('   Template: $effectiveTemplateId');
      print('   Cópias: $copies');
      print('   Offsets: X=${offsetX}mm, Y=${offsetY}mm');
      print('   Reimpressão: $reimpressao');
      
      // Validar authToken
      if (authToken == null || authToken.isEmpty) {
        return TagmentPrintResult.error(
          'Token de autenticação não fornecido',
          null,
        );
      }

      // Criar serviço v1.5
      final v15Service = V15PrintService(
        baseUrl: ApiConfig.granoboxApiUrl,
        authToken: authToken,
      );

      // Preparar labelData para o template
      final labelData = {
        'nome_produto': produto,
        'marca': marca,
        'sif': sif,
        'codigo': codigo ?? '', // Para reimpressão, usar o código existente
        'emb_original': dataEmbalagem,
        'manipulacao': dataManipulacao,
        'validade': dataValidade,
        'qtd_peso': qtdPeso,
        'responsavel': _formatarNomeOperador(responsavel),
        'armazenamento': armazenamento,
        'label_validade': labelValidade,
        if (logoUuid != null && logoUuid!.isNotEmpty) 'logo': logoUuid,
        // Sempre enviar campos da indústria (mesmo vazios) para evitar placeholders
        'lote_industria': loteIndustria ?? '',
        'data_vencimento_industria': dataVencimentoIndustria ?? '',
      };

      // Preparar metadata para rastreabilidade
      final metadata = {
        if (productId != null && productId.isNotEmpty) 'productId': productId,
        if (storageLocationId != null && storageLocationId.isNotEmpty) 
          'storageLocationId': storageLocationId,
        'conservationType': conservacao,
        'productionDate': _toIsoDate(dataManipulacao),
        'validityDate': _toIsoDate(dataValidade),
      };

      // Preparar offsets
      Map<String, int>? offsetsMap;
      if (offsetX != 0.0 || offsetY != 0.0) {
        offsetsMap = {
          'x': (offsetX * 8).round(), // Converter mm para dots (8 dots/mm para 203 DPI)
          'y': (offsetY * 8).round(),
        };
      }

      // Chamar novo endpoint v1.5
      // - Para impressão normal (não reimpressão): labelType='validity' → cria códigos únicos
      // - Para reimpressão: labelType='label' → usa o código fornecido, não cria registros
      // ⭐ IMPORTANTE: usar edgeAgentFingerprint (edge-go-xxx), não o UUID da impressora!
      // Se não tiver edgeAgentFingerprint, usar o ID como fallback
      final deviceId = printerInfo!.edgeAgentFingerprint ?? printerInfo!.id;
      print('🔍 PrinterId sendo enviado: $deviceId');
      
      final v15Result = await v15Service.printLabel(
        printerId: deviceId,
        labelType: reimpressao ? 'label' : 'validity',
        templateId: effectiveTemplateId,
        copies: copies,
        labelData: labelData,
        metadata: metadata,
        offsets: offsetsMap,
      );

      print('📨 [v1.5] Resposta recebida:');
      print('   Success: ${v15Result.success}');
      print('   Job ID: ${v15Result.jobId}');
      print('   Message: ${v15Result.message}');
      
      if (v15Result.labels != null) {
        print('   ✅ Labels criadas pelo backend: ${v15Result.labels!.length}');
        print('   Códigos: ${v15Result.labelCodes.join(', ')}');
      }

      // Converter resultado v1.5 para TagmentPrintResult
      final result = v15Result.success
          ? TagmentPrintResult.success(
              v15Result.message,
              v15Result.jobId ?? 'v15_${DateTime.now().millisecondsSinceEpoch}',
              {
                'method': 'v1.5',
                'printer': printerInfo!.displayName,
                'copies': copies,
                'labels': v15Result.labels,
                'labelCodes': v15Result.labelCodes,
                'details': v15Result.details,
              },
            )
          : TagmentPrintResult.error(
              v15Result.message,
              v15Result.error,
            );

      print('🎯 [v1.5] Resultado final:');
      print('   Success: ${result.success}');
      print('   Message: ${result.message}');

      return result;
    } catch (e, stackTrace) {
      print('❌ ===== ERRO CRÍTICO NA IMPRESSÃO =====');
      print('❌ Erro: $e');
      print('📚 Stack Trace: $stackTrace');
      return TagmentPrintResult.error('Erro ao imprimir: $e', null);
    }
  }

  /// Remover impressora da lista local (sem recarregar)
  void removerImpressoraDaLista(String printerId) {
    print('🗑️ Removendo impressora $printerId da lista local...');
    _impressoras.removeWhere((p) => p.id == printerId);
    print(
      '✅ Lista local atualizada: ${_impressoras.length} impressoras restantes',
    );
    notifyListeners();
  }

  /// Atualizar lista de impressoras
  Future<void> atualizarImpressoras() async {
    await carregarImpressoras();
  }

  /// Forçar atualização das impressoras (sem cache)
  Future<void> forcarAtualizacaoImpressoras({
    String? locationId,
    String? token,
    String? clientId,
  }) async {
    print('🔄 Forçando atualização das impressoras (sem cache)...');
    _impressoras.clear(); // Limpar lista atual
    await carregarImpressoras(
      locationId: locationId,
      forceRefresh: true,
      token: token,
      clientId: clientId,
    );
  }

  /// Obter impressora por ID
  PrinterInfo? obterImpressoraPorId(String id) {
    try {
      return _impressoras.firstWhere((p) => p.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Verificar se há impressoras online
  bool get temImpressorasOnline => impressorasOnline.isNotEmpty;

  /// Verificar se há impressoras de validade online
  bool get temImpressorasValidade => impressorasValidade.isNotEmpty;

  /// Obter serviço de edição de impressoras
  PrinterEditService? get editService => _editService;

  /// Obter serviço de criação de impressoras
  PrinterCreateService? get createService => _createService;

  /// Atualizar impressora via API v1
  Future<bool> atualizarImpressora({
    required String printerId,
    Map<String, dynamic>? configuracoesBasicas,
    Map<String, dynamic>? conexao,
    Map<String, dynamic>? capacidades,
    Map<String, dynamic>? offsets,
    Map<String, dynamic>? printAgent,
    Map<String, dynamic>? flutter,
    Map<String, dynamic>? status,
  }) async {
    if (_editService == null) {
      print('❌ Serviço de edição não inicializado');
      return false;
    }

    try {
      print('🔧 Atualizando impressora: $printerId');

      final success = await _editService!.atualizarConfiguracaoCompleta(
        printerId: printerId,
        configuracoesBasicas: configuracoesBasicas,
        conexao: conexao,
        capacidades: capacidades,
        offsets: offsets,
        printAgent: printAgent,
        flutter: flutter,
        status: status,
      );

      if (success) {
        print('✅ Impressora atualizada com sucesso');
        // Recarregar lista de impressoras para refletir as mudanças
        await forcarAtualizacaoImpressoras();
        return true;
      } else {
        print('❌ Falha ao atualizar impressora');
        return false;
      }
    } catch (e) {
      print('❌ Erro ao atualizar impressora: $e');
      return false;
    }
  }

  /// Atualizar offsets de uma impressora
  Future<bool> atualizarOffsetsImpressora({
    required String printerId,
    double? offsetX,
    double? offsetY,
  }) async {
    if (_editService == null) {
      print('❌ Serviço de edição não inicializado');
      return false;
    }

    try {
      print('🔧 Atualizando offsets da impressora: $printerId');
      print('   📍 Offset X: $offsetX mm');
      print('   📍 Offset Y: $offsetY mm');

      final success = await _editService!.atualizarOffsets(
        printerId: printerId,
        offsetX: offsetX,
        offsetY: offsetY,
      );

      if (success) {
        print('✅ Offsets atualizados com sucesso');
        // Recarregar lista de impressoras para refletir as mudanças
        await forcarAtualizacaoImpressoras();
        return true;
      } else {
        print('❌ Falha ao atualizar offsets');
        return false;
      }
    } catch (e) {
      print('❌ Erro ao atualizar offsets: $e');
      return false;
    }
  }

  /// Atualizar configurações de conexão de uma impressora
  Future<bool> atualizarConexaoImpressora({
    required String printerId,
    String? host,
    int? port,
    String? protocol,
    int? timeout,
  }) async {
    if (_editService == null) {
      print('❌ Serviço de edição não inicializado');
      return false;
    }

    try {
      print('🔧 Atualizando conexão da impressora: $printerId');
      print('   🌐 Host: $host');
      print('   🔌 Porta: $port');
      print('   📡 Protocolo: $protocol');

      final success = await _editService!.atualizarConfiguracaoTCP(
        printerId: printerId,
        host: host,
        port: port,
        protocol: protocol,
        timeout: timeout,
      );

      if (success) {
        print('✅ Conexão atualizada com sucesso');
        // Recarregar lista de impressoras para refletir as mudanças
        await forcarAtualizacaoImpressoras();
        return true;
      } else {
        print('❌ Falha ao atualizar conexão');
        return false;
      }
    } catch (e) {
      print('❌ Erro ao atualizar conexão: $e');
      return false;
    }
  }

  /// Criar nova impressora TCP
  Future<bool> criarImpressoraTCP({
    required String displayName,
    required String host,
    required String externalCustomerId,
    required String clientId, // ⭐ OBRIGATÓRIO
    String? operationId, // ⭐ NOVO
    int port = 9100,
    String protocol = 'zpl',
    int timeout = 30000,
    String? brand,
    String? model,
    String? thermalType,
    List<String>? tags,
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool supportsZPL = true,
    bool supportsCutter = false,
    bool supportsColor = false,
    double? offsetX,
    double? offsetY,
    bool autoConnect = true,
    bool debugMode = false,
    bool allowRemotePrinting = true,
    int? maxConcurrentJobs,
  }) async {
    if (_createService == null) {
      print('❌ Serviço de criação não inicializado');
      return false;
    }

    try {
      print('🔧 Criando nova impressora TCP: $displayName');

      final success = await _createService!.criarImpressoraTCP(
        displayName: displayName,
        host: host,
        externalCustomerId: externalCustomerId,
        clientId: clientId, // ⭐ OBRIGATÓRIO
        operationId: operationId, // ⭐ NOVO
        port: port,
        protocol: protocol,
        timeout: timeout,
        brand: brand,
        model: model,
        thermalType: thermalType,
        tags: tags,
        dpi: dpi,
        maxWidthMm: maxWidthMm,
        maxHeightMm: maxHeightMm,
        supportsZPL: supportsZPL,
        supportsCutter: supportsCutter,
        supportsColor: supportsColor,
        offsetX: offsetX,
        offsetY: offsetY,
        autoConnect: autoConnect,
        debugMode: debugMode,
        allowRemotePrinting: allowRemotePrinting,
        maxConcurrentJobs: maxConcurrentJobs,
      );

      if (success) {
        print('✅ Impressora TCP criada com sucesso');
        // Recarregar lista de impressoras para refletir as mudanças
        await forcarAtualizacaoImpressoras();
        return true;
      } else {
        print('❌ Falha ao criar impressora TCP');
        return false;
      }
    } catch (e) {
      print('❌ Erro ao criar impressora TCP: $e');
      return false;
    }
  }

  /// Criar nova impressora USB
  Future<bool> criarImpressoraUSB({
    required String displayName,
    required String externalCustomerId,
    String? devicePath,
    String? cupsName,
    String? cupsUri,
    int usbTimeout = 30000,
    String? brand,
    String? model,
    String? thermalType,
    List<String>? tags,
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool supportsZPL = true,
    bool supportsCutter = false,
    bool supportsColor = false,
    double? offsetX,
    double? offsetY,
    bool autoConnect = true,
    bool debugMode = false,
    bool allowRemotePrinting = true,
    int? maxConcurrentJobs,
  }) async {
    if (_createService == null) {
      print('❌ Serviço de criação não inicializado');
      return false;
    }

    try {
      print('🔧 Criando nova impressora USB: $displayName');

      final success = await _createService!.criarImpressoraUSB(
        displayName: displayName,
        externalCustomerId: externalCustomerId,
        devicePath: devicePath,
        cupsName: cupsName,
        cupsUri: cupsUri,
        usbTimeout: usbTimeout,
        brand: brand,
        model: model,
        thermalType: thermalType,
        tags: tags,
        dpi: dpi,
        maxWidthMm: maxWidthMm,
        maxHeightMm: maxHeightMm,
        supportsZPL: supportsZPL,
        supportsCutter: supportsCutter,
        supportsColor: supportsColor,
        offsetX: offsetX,
        offsetY: offsetY,
        autoConnect: autoConnect,
        debugMode: debugMode,
        allowRemotePrinting: allowRemotePrinting,
        maxConcurrentJobs: maxConcurrentJobs,
      );

      if (success) {
        print('✅ Impressora USB criada com sucesso');
        // Recarregar lista de impressoras para refletir as mudanças
        await forcarAtualizacaoImpressoras();
        return true;
      } else {
        print('❌ Falha ao criar impressora USB');
        return false;
      }
    } catch (e) {
      print('❌ Erro ao criar impressora USB: $e');
      return false;
    }
  }

  /// Criar impressora com configuração completa
  Future<bool> criarImpressoraCompleta({
    required String displayName,
    required String tipoConexao,
    required String externalCustomerId,
    // Configurações de conexão
    String? host,
    int? port,
    String? protocol,
    int? timeout,
    String? devicePath,
    String? cupsName,
    String? cupsUri,
    int? usbTimeout,
    // Configurações básicas
    String? brand,
    String? model,
    String? thermalType,
    List<String>? tags,
    // Capacidades
    int? dpi,
    double? maxWidthMm,
    double? maxHeightMm,
    bool? supportsZPL,
    bool? supportsCutter,
    bool? supportsColor,
    // Posicionamento
    double? offsetX,
    double? offsetY,
    // Print Agent
    bool? autoConnect,
    bool? debugMode,
    bool? allowRemotePrinting,
    int? maxConcurrentJobs,
  }) async {
    if (_createService == null) {
      print('❌ Serviço de criação não inicializado');
      return false;
    }

    try {
      print('🔧 Criando impressora completa: $displayName');
      print('   🔌 Tipo: $tipoConexao');

      final success = await _createService!.criarImpressoraCompleta(
        displayName: displayName,
        tipoConexao: tipoConexao,
        externalCustomerId: externalCustomerId,
        host: host,
        port: port,
        protocol: protocol,
        timeout: timeout,
        devicePath: devicePath,
        cupsName: cupsName,
        cupsUri: cupsUri,
        usbTimeout: usbTimeout,
        brand: brand,
        model: model,
        thermalType: thermalType,
        tags: tags,
        dpi: dpi,
        maxWidthMm: maxWidthMm,
        maxHeightMm: maxHeightMm,
        supportsZPL: supportsZPL,
        supportsCutter: supportsCutter,
        supportsColor: supportsColor,
        offsetX: offsetX,
        offsetY: offsetY,
        autoConnect: autoConnect,
        debugMode: debugMode,
        allowRemotePrinting: allowRemotePrinting,
        maxConcurrentJobs: maxConcurrentJobs,
      );

      if (success) {
        print('✅ Impressora criada com sucesso');
        // Recarregar lista de impressoras para refletir as mudanças
        await forcarAtualizacaoImpressoras();
        return true;
      } else {
        print('❌ Falha ao criar impressora');
        return false;
      }
    } catch (e) {
      print('❌ Erro ao criar impressora: $e');
      return false;
    }
  }

  /// Formatar nome do operador para exibir primeiro nome + primeira letra do último nome
  String _formatarNomeOperador(String? nomeCompleto) {
    if (nomeCompleto == null || nomeCompleto.isEmpty) {
      return '';
    }

    final partes = nomeCompleto.trim().split(' ');
    if (partes.length == 1) {
      return partes[0]; // Se só tem um nome, retorna ele
    }

    final primeiroNome = partes[0];
    final ultimoNome = partes[partes.length - 1];
    final primeiraLetraUltimoNome = ultimoNome.isNotEmpty
        ? ultimoNome[0].toUpperCase()
        : '';

    return '$primeiroNome $primeiraLetraUltimoNome';
  }

  // Métodos privados
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  /// Imprimir etiqueta usando template (modo simplificado - igual web-vite)
  Future<TagmentPrintResult> imprimirComTemplate({
    required PrinterInfo printer,
    required String templateId,
    required Map<String, dynamic> templateData,
    int copies = 1,
    String? clientId,
    String? authToken,
    String? productId,
    String? storageLocationId,
    String? conservacao,
    String? productionDate,
    String? validityDate,
    String? manufacturingBatch,
    String? expiryDate,
    String? operationId, // ⭐ NOVO: ID da operação
    Function(String)? onProgress, // ⭐ NOVO: Callback de progresso
    bool reimpressao = false,
    bool isLabelOnly = false, // ⭐ NOVO: Quando true, é só rótulo (sem código/rastreabilidade)
  }) async {
    try {
      if (_currentApiKey == null || _currentApiKey!.isEmpty) {
        print('❌ API Key não configurada');
        return TagmentPrintResult.error('API Key não configurada', null);
      }

      print('🖨️ ===== IMPRESSÃO COM TEMPLATE (MODO SIMPLIFICADO) =====');
      print('🖨️ Impressora: ${printer.displayName}');
      print('📋 Template ID: $templateId');
      print('📦 Dados do template: $templateData');
      print('📄 Cópias: $copies');

      // Buscar UUID do logo do cliente (se disponível)
      String? logoUuid;
      try {
        if ((clientId != null && clientId.isNotEmpty) &&
            (authToken != null && authToken.isNotEmpty)) {
          final clientInfo = await _clientService.getClientInfo(
            clientId,
            authToken,
          );
          logoUuid = clientInfo?['tagmentLogoUuid']?.toString();
          if (logoUuid != null && logoUuid!.isNotEmpty) {
            print('🖼️ Logo UUID do cliente: $logoUuid');
          } else {
            print('⚠️ Logo UUID do cliente não configurado');
          }
        }
      } catch (e) {
        print('⚠️ Falha ao obter logo do cliente: $e');
      }

      // Enriquecer templateData com logo e formatar responsável
      final enrichedTemplateData = Map<String, dynamic>.from(templateData);
      if (logoUuid != null && logoUuid!.isNotEmpty) {
        enrichedTemplateData['logo'] = logoUuid;
      }
      if (enrichedTemplateData['responsavel'] != null &&
          enrichedTemplateData['responsavel'] != '') {
        enrichedTemplateData['responsavel'] = _formatarNomeOperador(
          enrichedTemplateData['responsavel'],
        );
      }

      // Garantir que campos da indústria estejam sempre presentes
      if (!enrichedTemplateData.containsKey('lote_industria')) {
        enrichedTemplateData['lote_industria'] = manufacturingBatch ?? '';
      }
      if (!enrichedTemplateData.containsKey('data_vencimento_industria')) {
        enrichedTemplateData['data_vencimento_industria'] = expiryDate ?? '';
      }

      // ⭐ NOVO: Verificar se template é multi-coluna
      dynamic finalLabelData = enrichedTemplateData;
      try {
        if (_currentApiKey != null && _currentApiKey!.isNotEmpty) {
          final templatesService = TemplatesService();
          final template = await templatesService.getTemplateById(
            templateId,
            token: authToken ?? '',
            tagmentApiKey: _currentApiKey,
          );
          
          if (template != null && template.isMultiColumn) {
            print('📊 [Multi-Column] Template detectado como multi-coluna:');
            print('   Colunas: ${template.labelLayout!.columns}');
            print('   Gap: ${template.labelLayout!.columnGap}mm');
            print('   Largura por etiqueta: ${template.labelLayout!.labelWidth}mm');
            
            // Preparar array de dados (um para cada coluna)
            // Por padrão, duplicamos os dados para cada coluna
            // O usuário pode ajustar depois para passar dados diferentes por coluna
            final dataItems = List.generate(
              template.labelLayout!.columns,
              (index) => Map<String, dynamic>.from(enrichedTemplateData),
            );
            
            finalLabelData = dataItems;
            print('📊 [Multi-Column] Preparados ${dataItems.length} itens de dados');
          } else {
            print('📊 [Single-Column] Template de coluna única');
          }
        }
      } catch (e) {
        print('⚠️ [Multi-Column] Erro ao verificar template (continuando com single): $e');
        // Continuar com dados single se houver erro
      }

      // ⭐ NOVA ARQUITETURA v1.5: Backend cria etiquetas, processa templates e envia para Edge-Go
      print('🚀 [v1.5] Iniciando impressão via novo endpoint...');
      print('   Impressora: ${printer.displayName}');
      print('   Template: $templateId');
      print('   Cópias: $copies');
      print('   Reimpressão: $reimpressao');
      
      // ⭐ Atualizar progresso: Gerando etiqueta(s)
      final copiesText = copies > 1 ? '$copies etiquetas' : 'etiqueta';
      print('📢 [Progresso] Gerando $copiesText...');
      onProgress?.call('Gerando $copiesText...');
      
      // ⭐ Delay mínimo para usuário ver a mensagem (300ms)
      await Future.delayed(const Duration(milliseconds: 300));
      await Future.delayed(const Duration(milliseconds: 50));
      
      // Validar authToken
      if (authToken == null || authToken.isEmpty) {
        return TagmentPrintResult.error(
          'Token de autenticação não fornecido',
          null,
        );
      }

      // Criar serviço v1.5
      final v15Service = V15PrintService(
        baseUrl: ApiConfig.granoboxApiUrl,
        authToken: authToken,
      );

      // Obter offsets da impressora
      final offsets = obterOffsetsImpressora(printer);
      final offsetX = offsets['x'] ?? 0.0;
      final offsetY = offsets['y'] ?? 0.0;
      
      print('📏 Offsets: X=${offsetX}mm, Y=${offsetY}mm');

      // Preparar offsets
      Map<String, int>? offsetsMap;
      if (offsetX != 0.0 || offsetY != 0.0) {
        offsetsMap = {
          'x': (offsetX * 8).round(), // Converter mm para dots (8 dots/mm para 203 DPI)
          'y': (offsetY * 8).round(),
        };
      }

      // Preparar metadata para rastreabilidade
      final metadata = <String, dynamic>{};
      if (productId != null && productId.isNotEmpty) {
        metadata['productId'] = productId;
      }
      if (storageLocationId != null && storageLocationId.isNotEmpty) {
        metadata['storageLocationId'] = storageLocationId;
      }
      if (conservacao != null && conservacao.isNotEmpty) {
        metadata['conservationType'] = conservacao;
      }
      if (productionDate != null && productionDate.isNotEmpty) {
        metadata['productionDate'] = productionDate;
      }
      if (validityDate != null && validityDate.isNotEmpty) {
        metadata['validityDate'] = validityDate;
      }

      // Chamar novo endpoint v1.5
      // ⭐ REMOVIDO: Mensagem intermediária "Processando templates..." (igual ao fluxo de validade)
      
      // - Para impressão normal (não reimpressão e não isLabelOnly): labelType='validity' → cria códigos únicos
      // - Para reimpressão ou isLabelOnly: labelType='label' → não cria registros de rastreabilidade
      // ⭐ IMPORTANTE: usar edgeAgentFingerprint (edge-go-xxx), não o UUID da impressora!
      // Se não tiver edgeAgentFingerprint, usar o ID como fallback
      final deviceId = printer.edgeAgentFingerprint ?? printer.id;
      print('🔍 PrinterId sendo enviado: $deviceId');
      print('🏷️ isLabelOnly: $isLabelOnly (apenas rótulo, sem rastreabilidade)');
      
      // ⭐ NOVO: Se isLabelOnly, usa 'label' (sem criar registros de rastreabilidade)
      final effectiveLabelType = (reimpressao || isLabelOnly) ? 'label' : 'validity';
      print('📋 LabelType efetivo: $effectiveLabelType');
      
      final v15Result = await v15Service.printLabel(
        printerId: deviceId,
        labelType: effectiveLabelType,
        templateId: templateId,
        copies: copies,
        labelData: finalLabelData, // Pode ser Map ou List<Map> para multi-coluna
        metadata: metadata.isNotEmpty ? metadata : null,
        offsets: offsetsMap,
      );

      print('📨 [v1.5] Resposta do envio:');
      print('   Success: ${v15Result.success}');
      print('   Job ID: ${v15Result.jobId}');
      print('   Message: ${v15Result.message}');

      if (!v15Result.success) {
        return TagmentPrintResult.error(
          v15Result.message,
          v15Result.error,
        );
      }

      // Job foi aceito pelo backend; aguardar confirmação real do dispositivo (print_ack)
      // para só então mostrar sucesso ou erro (ex.: tampa aberta, sem papel).
      final jobId = v15Result.jobId ?? 'v15_${DateTime.now().millisecondsSinceEpoch}';
      if (v15Result.jobId != null) {
        // ⭐ Atualizar progresso: Enviando para impressora
        final printCopiesText = copies > 1 ? '$copies etiquetas' : 'etiqueta';
        print('📢 [Progresso] Enviando $printCopiesText para impressora...');
        onProgress?.call('Enviando para impressora...');
        // ⭐ Delay mínimo para usuário ver a mensagem (400ms)
        await Future.delayed(const Duration(milliseconds: 400));
        
        final result = await v15Service.pollJobStatusUntilComplete(
          jobId: v15Result.jobId!,
          printerName: printer.displayName,
          labelsFromCreate: v15Result.labels,
          detailsFromCreate: v15Result.details,
          onProgress: onProgress,
          copies: copies, // ⭐ Passa número de cópias para calcular timeout dinâmico
          initialDelay: const Duration(milliseconds: 300), // Reduzido para feedback mais rápido
          interval: const Duration(milliseconds: 1500), // Polling mais frequente
        );
        print('🎯 [v1.5] Resultado após confirmação do dispositivo:');
        print('   Success: ${result.success}');
        print('   Message: ${result.message}');
        return result;
      }

      // Fallback: job sem ID (não deveria ocorrer)
      return TagmentPrintResult.success(
        v15Result.message,
        jobId,
        {
          'method': 'v1.5',
          'printer': printer.displayName,
          'copies': copies,
          'labels': v15Result.labels,
          'labelCodes': v15Result.labelCodes,
          'details': v15Result.details,
        },
      );
    } catch (e, stackTrace) {
      print('❌ ===== ERRO CRÍTICO NA IMPRESSÃO =====');
      print('❌ Erro: $e');
      print('📚 Stack Trace: $stackTrace');
      return TagmentPrintResult.error('Erro ao imprimir: $e', null);
    }
  }

  /// Aplicar offsets no código ZPL (converte mm -> pontos 8dp/mm e ajusta ^FOx,y)
  String _applyOffsetsToZPL(String zpl, double offsetXmm, double offsetYmm) {
    if (offsetXmm == 0.0 && offsetYmm == 0.0) {
      return zpl;
    }
    final int dx = (offsetXmm * 8).round();
    final int dy = (offsetYmm * 8).round();
    final foRegex = RegExp(r'\^FO(\d+),(\d+)');
    final ftRegex = RegExp(r'\^FT(\d+),(\d+)');
    String modified = zpl.replaceAllMapped(foRegex, (m) {
      final x = int.parse(m.group(1)!);
      final y = int.parse(m.group(2)!);
      final nx = (x + dx).clamp(0, 9999);
      final ny = (y + dy).clamp(0, 9999);
      return '^FO$nx,$ny';
    });
    modified = modified.replaceAllMapped(ftRegex, (m) {
      final x = int.parse(m.group(1)!);
      final y = int.parse(m.group(2)!);
      final nx = (x + dx).clamp(0, 9999);
      final ny = (y + dy).clamp(0, 9999);
      return '^FT$nx,$ny';
    });
    return modified;
  }

  /// Imprimir etiqueta personalizada (sem rastreabilidade, apenas substitui variáveis no template)
  /// Usado para etiquetas de rótulo como: hospitalar, nutricional, etc.
  /// Usa o mesmo fluxo do imprimirComTemplate com isLabelOnly: true
  Future<bool> imprimirEtiquetaPersonalizada({
    required String templateId,
    required Map<String, dynamic> data,
    int quantidade = 1,
    PrinterInfo? printer,
    String? clientId,
    String? authToken,
  }) async {
    try {
      if (_currentApiKey == null || _currentApiKey!.isEmpty) {
        print('❌ API Key não configurada');
        return false;
      }

      // Selecionar impressora (usar a passada ou a primeira online disponível)
      final printerInfo = printer ?? 
          (impressorasOnline.isNotEmpty 
              ? impressorasOnline.first 
              : (_impressoras.isNotEmpty ? _impressoras.first : null));
      
      if (printerInfo == null) {
        print('❌ Nenhuma impressora disponível');
        return false;
      }

      print('🖨️ ===== IMPRESSÃO PERSONALIZADA =====');
      print('🖨️ Impressora: ${printerInfo.displayName}');
      print('📋 Template ID: $templateId');
      print('📦 Dados: $data');
      print('📄 Quantidade: $quantidade');

      // Usar o mesmo fluxo do imprimirComTemplate com isLabelOnly: true
      // Isso garante que usa o edgeAgentFingerprint correto e o v15Service
      final result = await imprimirComTemplate(
        printer: printerInfo,
        templateId: templateId,
        templateData: data,
        copies: quantidade,
        clientId: clientId,
        authToken: authToken,
        isLabelOnly: true, // Não criar registros de rastreabilidade
      );

      if (result.success) {
        print('✅ Impressão personalizada enviada com sucesso!');
        return true;
      } else {
        print('❌ Erro na impressão: ${result.message}');
        return false;
      }
    } catch (e) {
      print('❌ Erro ao imprimir etiqueta personalizada: $e');
      return false;
    }
  }

  /// Reset ao trocar de cliente (limpar impressoras e API key)
  void resetAll() {
    _impressoras.clear();
    _apiKeyStatus = null;
    _currentApiKey = null;
    _error = null;
    _isLoading = false;
    notifyListeners();
  }
}
