import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'etiquetas_screen.dart';
import 'nova_etiqueta_screen.dart';
import 'config_screen.dart';
import 'cadastros_screen.dart';
import 'alertas_screen.dart';
import 'rastreabilidade_screen.dart';
import '../components/bottom_navigation.dart';
import '../theme/app_theme.dart';
import 'package:provider/provider.dart';
import '../providers/operator_session_provider.dart';
import '../providers/operators_provider.dart';
import '../providers/print_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/operations_provider.dart';
import 'access_denied_screen.dart';
import '../utils/system_ui_helper.dart';

class MainScreen extends StatefulWidget {
  final int? initialIndex;
  
  const MainScreen({super.key, this.initialIndex});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with WidgetsBindingObserver {
  late int _currentIndex;
  VoidCallback? _opsListener;
  DateTime? _lastPrinterRefresh;

  final List<Widget> _screens = [
    const NovaEtiquetaScreen(), // 0 - Etiquetas (Nova Etiqueta)
    const AlertasScreen(), // 1 - Alertas
    const RastreabilidadeScreen(), // 2 - Rastreabilidade
    const CadastrosScreen(), // 3 - Cadastros (Cadastros)
    const ConfigScreen(), // 4 - Ajustes (Configurações)
  ];

  @override
  void initState() {
    super.initState();
    // Inicializar índice (se fornecido, usar; senão, padrão 0)
    _currentIndex = widget.initialIndex ?? 0;
    
    // Adicionar observer de lifecycle do app
    WidgetsBinding.instance.addObserver(this);

    // Configurar a barra de status imediatamente
    _configurarBarraStatus();

    // Configurar novamente após o frame ser construído
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _configurarBarraStatus();
      // Sincronizar sessão do operador com lista atualizada e ouvir mudanças
      try {
        final ops = context.read<OperatorsProvider>();
        // Forçar refresh no primeiro load para garantir role atualizada
        ops.loadOperators(forceRefresh: true).then((_) {
          try {
            context.read<OperatorSessionProvider>().refreshFromOperators(
              ops.operators,
            );
          } catch (_) {}
        });
        // Sincroniza imediatamente se já houver dados
        context.read<OperatorSessionProvider>().refreshFromOperators(
          ops.operators,
        );
        // Registrar listener para futuras mudanças
        _opsListener = () {
          try {
            context.read<OperatorSessionProvider>().refreshFromOperators(
              ops.operators,
            );
          } catch (_) {}
        };
        ops.addListener(_opsListener!);
      } catch (_) {}

      // ⭐ NOVO: Carregar operações
      _loadOperations();

      // Carregar impressoras inicialmente
      _refreshPrinters();
    });
  }

  @override
  void dispose() {
    // Remover observer de lifecycle
    WidgetsBinding.instance.removeObserver(this);

    // Remover listener de operadores
    if (_opsListener != null) {
      try {
        context.read<OperatorsProvider>().removeListener(_opsListener!);
      } catch (_) {}
    }
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);

    // Quando o app volta ao foreground, atualizar impressoras
    if (state == AppLifecycleState.resumed) {
      print(
        '📱 App voltou ao foreground - verificando se precisa atualizar impressoras',
      );
      _refreshPrinters();
    }
  }

  /// Atualizar lista de impressoras (com throttle de 30 segundos)
  /// Apenas recarrega da API - NÃO faz testes de impressão
  void _refreshPrinters() async {
    try {
      print(
        '🔄 Atualizando lista de impressoras silenciosamente (sem testes de impressão)...',
      );
      _lastPrinterRefresh = DateTime.now();

      final tagmentProvider = context.read<PrintProvider>();
      final authProvider = context.read<AuthProvider>();

      // Obter token e clientId
      final clientId = authProvider.user?.clientId;
      final token = await authProvider.authToken;

      // Configurar API Key se necessário
      if (tagmentProvider.apiKeyAtual == null ||
          tagmentProvider.apiKeyAtual!.isEmpty) {
        if (clientId != null && token != null) {
          await tagmentProvider.configurarApiKeyDoCliente(clientId, token);
        }
      }

      // ⭐ SEMPRE recarregar da API (forceRefresh: true) para pegar dados atualizados
      // Isso garante que mudanças de type/printMethod/interface sejam refletidas
      // Passar token e clientId explicitamente
      await tagmentProvider.carregarImpressoras(
        forceRefresh: true,
        token: token,
        clientId: clientId,
      );
      print('✅ Lista de impressoras atualizada silenciosamente');
    } catch (e) {
      print('❌ Erro ao atualizar impressoras: $e');
    }
  }

  // ⭐ NOVO: Carregar operações
  Future<void> _loadOperations() async {
    try {
      final authProvider = context.read<AuthProvider>();
      final operationsProvider = context.read<OperationsProvider>();

      if (authProvider.isAuthenticated) {
        final token = await authProvider.authToken;
        final clientId = authProvider.user?.clientId;

        if (token != null) {
          await operationsProvider.loadOperations(
            token: token,
            clientId: clientId,
          );
          print(
            '✅ Operações carregadas: ${operationsProvider.operations.length}',
          );
        }
      }
    } catch (e) {
      print('❌ Erro ao carregar operações: $e');
    }
  }

  void _configurarBarraStatus() async {
    print('🔧 Configurando barras do sistema para tema escuro completo...');

    try {
      // Primeiro, definir o modo da UI do sistema
      await SystemChrome.setEnabledSystemUIMode(
        SystemUiMode.edgeToEdge,
        overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom],
      );

      // Aguardar um pouco para garantir que a mudança foi aplicada
      await Future.delayed(const Duration(milliseconds: 50));

      // Configurar barras (status e navegação) para pretas e ícones claros
      await SystemUiHelper.setSystemUiOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarColor: Colors.black,
          statusBarIconBrightness: Brightness.light,
          statusBarBrightness: Brightness.dark,
          systemNavigationBarColor: Colors.black,
          systemNavigationBarIconBrightness: Brightness.light,
          systemNavigationBarDividerColor: Colors.transparent,
        ),
      );

      print('✅ Barra de status configurada com sucesso!');

      // Reaplicar após um pequeno delay
      Future.delayed(const Duration(milliseconds: 200), () {
        SystemUiHelper.setSystemUiOverlayStyle(
          const SystemUiOverlayStyle(
            statusBarColor: Colors.black,
            statusBarIconBrightness: Brightness.light,
            statusBarBrightness: Brightness.dark,
            systemNavigationBarColor: Colors.black,
            systemNavigationBarIconBrightness: Brightness.light,
          ),
        );
        print('🔄 Barras do sistema reconfiguradas!');
      });
    } catch (e) {
      print('❌ Erro ao configurar barra de status: $e');
    }
  }

  void _onNavItemTapped(int index) {
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    // Consumidores dentro do IndexedStack para evitar reconstruções ao trocar abas
    final guardedCadastros = Consumer<OperatorSessionProvider>(
      builder: (context, session, _) => session.canAccessProducts
          ? const CadastrosScreen()
          : const AccessDeniedScreen(requiredLevel: 'intermediate'),
    );
    final guardedConfig = Consumer<OperatorSessionProvider>(
      builder: (context, session, _) => session.canAccessSettings
          ? const ConfigScreen()
          : const AccessDeniedScreen(requiredLevel: 'advanced'),
    );
    final guardedAlertas = Consumer<OperatorSessionProvider>(
      builder: (context, session, _) => session.canAccessControl
          ? const AlertasScreen()
          : const AccessDeniedScreen(requiredLevel: 'basic'),
    );
    final guardedRastreabilidade = Consumer<OperatorSessionProvider>(
      builder: (context, session, _) => session.canAccessControl
          ? const RastreabilidadeScreen()
          : const AccessDeniedScreen(requiredLevel: 'basic'),
    );
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: Column(
        children: [
          // Conteúdo das telas
          Expanded(
            child: IndexedStack(
              index: _currentIndex,
              children: [
                const NovaEtiquetaScreen(), // 0
                guardedAlertas, // 1
                guardedRastreabilidade, // 2
                guardedCadastros, // 3
                guardedConfig, // 4
              ],
            ),
          ),

          // Navegação inferior
          SafeArea(
            top: false,
            child: BottomNavigation(
              currentIndex: _currentIndex,
              onTap: _onNavItemTapped,
            ),
          ),
        ],
      ),
    );
  }
}
