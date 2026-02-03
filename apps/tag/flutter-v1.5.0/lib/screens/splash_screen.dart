import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:flutter/services.dart' show SystemUiOverlayStyle;
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../utils/page_transitions.dart';
import '../utils/system_ui_helper.dart';
import 'login_screen.dart';
import 'main_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _navegou = false;
  @override
  void initState() {
    super.initState();
    _configurarBarraStatus();
    _navegarParaMain();
  }

  void _configurarBarraStatus() {
    // Configurar a barra de status para ficar verde como o fundo
    SystemUiHelper.setSystemUiOverlayStyle(
      const SystemUiOverlayStyle(
        statusBarColor: Color(0xFF1DA154), // Verde sólido
        statusBarIconBrightness: Brightness.light, // Ícones brancos
        statusBarBrightness: Brightness.dark, // Para iOS
        systemNavigationBarColor: Color(
          0xFF1DA154,
        ), // Barra de navegação também verde
        systemNavigationBarIconBrightness: Brightness.light,
      ),
    );
  }

  void _navegarParaMain() async {
    try {
      // Inicializar o AuthProvider
      final authProvider = context.read<AuthProvider>();
      // Garantir que a splash não fique travada
      await authProvider.initialize().timeout(
        const Duration(seconds: 4),
        onTimeout: () {
          return;
        },
      );

      // Aguardar um tempo mínimo para mostrar a splash
      await Future.delayed(const Duration(seconds: 2));

      // Navegar baseado no estado de autenticação
      if (mounted) {
        if (authProvider.isAuthenticated) {
          // Usuário já está logado, ir para tela principal com transição moderna
          Navigator.of(context).pushReplacement(
            AppPageTransitions.slideAndFadeTransition(page: const MainScreen()),
          );
          _navegou = true;
        } else {
          // Usuário não está logado, ir para tela de login com transição moderna
          Navigator.of(context).pushReplacement(
            AppPageTransitions.slideAndFadeTransition(
              page: const LoginScreen(),
            ),
          );
          _navegou = true;
        }
      }
    } catch (error) {
      debugPrint('Erro na navegação: $error');
      // Se houver erro, tentar navegar para login
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
        _navegou = true;
      }
    }

    // Fallback final: se por algum motivo não navegou, forçar login após 6s
    if (mounted && !_navegou) {
      await Future.delayed(const Duration(seconds: 6));
      if (mounted && !_navegou) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
        );
        _navegou = true;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Obter a altura da barra de status
    final statusBarHeight = MediaQuery.of(context).padding.top;

    return Scaffold(
      backgroundColor: const Color(0xFF1DA154), // Verde sólido
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          color: Color(0xFF1DA154), // Verde sólido
        ),
        child: Padding(
          // Adicionar padding no topo para compensar a barra de status
          padding: EdgeInsets.only(top: statusBarHeight),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Transform.translate(
                offset: const Offset(0, -30), // Deslocar ligeiramente para cima
                child: Column(
                  children: [
                    // Título principal
                    SizedBox(
                      height: 44,
                      child: SvgPicture.asset(
                        'assets/logo-granobox.svg',
                        colorFilter: const ColorFilter.mode(
                          Colors.white,
                          BlendMode.srcIn,
                        ),
                        fit: BoxFit.contain,
                      ),
                    ),

                    SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
