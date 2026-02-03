import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'theme/app_theme.dart';
import 'providers/granobox_api_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/categories_products_provider.dart';
import 'providers/connectivity_provider.dart';
import 'providers/storage_locations_provider.dart';
import 'providers/print_provider.dart';
import 'providers/tagment_printer_config_provider.dart';
import 'providers/granobox_printer_provider.dart';
import 'providers/date_config_provider.dart';
import 'providers/operators_provider.dart';
import 'providers/operations_provider.dart';
import 'providers/labels_provider.dart';
import 'providers/label_templates_provider.dart';
import 'providers/label_items_provider.dart';
import 'services/legacy_print_service.dart';
import 'providers/operator_session_provider.dart';
import 'providers/print_config_provider.dart';
import 'services/smart_cache_service.dart';
import 'services/environment_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // ⭐ Inicializar serviço de ambiente (staging/production)
  await EnvironmentService.initialize();
  
  runApp(const GranoboxTagApp());
}

class GranoboxTagApp extends StatelessWidget {
  const GranoboxTagApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ConnectivityProvider()..initialize()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => GranoboxApiProvider()),
        ChangeNotifierProvider(create: (_) => CategoriesProductsProvider()),
        ChangeNotifierProxyProvider<AuthProvider, StorageLocationsProvider>(
          create: (context) => StorageLocationsProvider(
            context.read<AuthProvider>(),
          ),
          update: (context, authProvider, previous) {
            return previous ?? StorageLocationsProvider(authProvider);
          },
        ),
        ChangeNotifierProvider(
          create: (_) => PrintProvider(
            printService: LegacyPrintService(
              apiKey: 'tgm_temp_key', // Será substituída automaticamente pela API Key do cliente
            ),
          ),
        ),
        ChangeNotifierProxyProvider<AuthProvider, TagmentPrinterConfigProvider>(
          create: (context) => TagmentPrinterConfigProvider(
            context.read<AuthProvider>(),
          ),
          update: (context, authProvider, previous) {
            return previous ?? TagmentPrinterConfigProvider(authProvider);
          },
        ),
        // ⭐ NOVO: Provider para impressoras 100% Granobox
        ChangeNotifierProvider(create: (_) => GranoboxPrinterProvider()),
        ChangeNotifierProvider(create: (_) => DateConfigProvider()),
        ChangeNotifierProvider(create: (_) => PrintConfigProvider()),
        ChangeNotifierProvider(create: (_) => OperatorSessionProvider()),
    ChangeNotifierProxyProvider<AuthProvider, OperatorsProvider>(
      create: (context) => OperatorsProvider(
        context.read<AuthProvider>(),
      ),
      update: (context, authProvider, previous) {
        return previous ?? OperatorsProvider(authProvider);
      },
    ),
    ChangeNotifierProvider(
      create: (context) => OperationsProvider(),
    ),
    ChangeNotifierProvider(create: (_) => LabelsProvider()),
        ChangeNotifierProvider(create: (_) => LabelTemplatesProvider()),
        ChangeNotifierProvider(create: (_) => LabelItemsProvider()),
      ],
      child: MaterialApp(
      title: 'Granobox Tag',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.darkTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.dark,
      
      // Configurações para evitar interferência do sistema
      builder: (context, child) {
        final media = MediaQuery.of(context).copyWith(
          platformBrightness: Brightness.dark,
        );
        return SessionResetter(
          child: MediaQuery(data: media, child: child!),
        );
      },
      
      // Configuração de localização para português brasileiro
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('pt', 'BR'), // Português Brasil
        Locale('en', 'US'), // Inglês como fallback
      ],
      locale: const Locale('pt', 'BR'), // Idioma padrão
      
      home: const SplashScreen(),
      ),
    );
  }
}

/// Widget que observa mudanças de sessão/cliente e reseta caches/providers
class SessionResetter extends StatefulWidget {
  final Widget child;
  const SessionResetter({super.key, required this.child});
  @override
  State<SessionResetter> createState() => _SessionResetterState();
}

class _SessionResetterState extends State<SessionResetter> {
  String? _lastClientId;
  bool _lastAuth = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _checkAndResetIfNeeded();
  }

  @override
  void didUpdateWidget(covariant SessionResetter oldWidget) {
    super.didUpdateWidget(oldWidget);
    _checkAndResetIfNeeded();
  }

  Future<void> _checkAndResetIfNeeded() async {
    final auth = context.read<AuthProvider>();
    final currentClientId = auth.user?.clientId;
    final isAuth = auth.isAuthenticated;

    // Só resetar se realmente mudou o cliente OU fez logout
    // Não resetar por mudanças de estado internas do provider
    final changedClient = (_lastClientId != null && currentClientId != null && _lastClientId != currentClientId);
    final didLogout = (_lastAuth == true && isAuth == false);

    // Apenas resetar em situações específicas
    if (changedClient || didLogout) {
      _lastClientId = currentClientId;
      _lastAuth = isAuth;

      // Limpar caches globais e resetar providers de dados atrelados ao cliente
      try { await SmartCacheService.clearAllCache(); } catch (_) {}
      try { context.read<OperatorSessionProvider>().setCurrentOperator(null); } catch (_) {}
      try { await context.read<OperatorsProvider>().resetAll(); } catch (_) {}
      try { context.read<OperationsProvider>().resetAll(); } catch (_) {}
      try { await context.read<CategoriesProductsProvider>().resetAll(); } catch (_) {}
      try { context.read<StorageLocationsProvider>().resetAll(); } catch (_) {}
      try { context.read<PrintProvider>().resetAll(); } catch (_) {}
      try { context.read<GranoboxPrinterProvider>().resetAll(); } catch (_) {}
      try { context.read<LabelsProvider>().resetAll(); } catch (_) {}
    } else {
      // Apenas atualizar o estado sem resetar
      if (_lastClientId == null && currentClientId != null) {
        _lastClientId = currentClientId;
      }
      if (_lastAuth != isAuth) {
        _lastAuth = isAuth;
      }
    }
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
