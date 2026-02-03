import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:fluttertoast/fluttertoast.dart';
import 'package:provider/provider.dart';
import 'main_screen.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../components/form_input.dart';
import '../hooks/use_form_validation.dart';
import '../theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../widgets/connectivity_status_widget.dart';
import '../services/biometric_service.dart';
import '../utils/page_transitions.dart';
import '../utils/system_ui_helper.dart';
import 'forgot_password_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final Map<String, TextEditingController> _controllers = {
    'email': TextEditingController(),
    'password': TextEditingController(),
  };

  final Map<String, String?> _errors = {};
  final Map<String, bool> _touched = {};
  bool _isSubmitting = false;
  bool _showPassword = false;
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;
  bool _rememberLogin = false;
  bool _autoBiometricAttempted = false;
  bool _showManualLogin = false;

  late FormValidationHook _formHook;

  final Map<String, ValidationRule> _validationRules = {
    'email': ValidationRule(
      required: true,
      pattern: RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$'),
      custom: (value) {
        if (value != null &&
            !RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value)) {
          return 'Email inválido';
        }
        return null;
      },
    ),
    'password': ValidationRule(
      required: true,
      minLength: 6,
      custom: (value) {
        if (value != null && value.length < 6) {
          return 'Senha deve ter pelo menos 6 caracteres';
        }
        return null;
      },
    ),
  };

  @override
  void initState() {
    super.initState();

    // Removidos valores padrão de email e senha

    // Inicializar form validation
    _formHook = FormValidationHook(
      controllers: _controllers,
      errors: _errors,
      touched: _touched,
      isSubmitting: _isSubmitting,
      setError: _setError,
      setTouched: _setTouched,
      setSubmitting: _setSubmitting,
    );

    // Verificar status da biometria
    _checkBiometricStatus();

    // Barras do sistema pretas no login
    _configurarBarrasPretas();

    // Carregar credenciais salvas (se houver)
    _loadSavedLogin();
  }

  void _configurarBarrasPretas() async {
    try {
      await SystemChrome.setEnabledSystemUIMode(
        SystemUiMode.edgeToEdge,
        overlays: [SystemUiOverlay.top, SystemUiOverlay.bottom],
      );
      await Future.delayed(const Duration(milliseconds: 50));
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
    } catch (_) {}
  }

  Future<void> _loadSavedLogin() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final remember = prefs.getBool('remember_login') ?? false;
      if (!remember) return;
      final email = prefs.getString('saved_email') ?? '';
      final password = prefs.getString('saved_password') ?? '';
      if (mounted) {
        setState(() {
          _rememberLogin = remember;
          _controllers['email']!.text = email;
          _controllers['password']!.text = password;
        });
      }
    } catch (_) {}
  }

  Future<void> _persistLoginIfNeeded() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_rememberLogin) {
        await prefs.setBool('remember_login', true);
        await prefs.setString(
          'saved_email',
          _controllers['email']!.text.trim(),
        );
        await prefs.setString('saved_password', _controllers['password']!.text);
      } else {
        await prefs.remove('remember_login');
        await prefs.remove('saved_email');
        await prefs.remove('saved_password');
      }
    } catch (_) {}
  }

  Future<void> _checkBiometricStatus() async {
    final status = await BiometricService.getBiometricStatus();
    debugPrint('🔐 LoginScreen - biometric status: ${status.toJson()}');
    if (mounted) {
      setState(() {
        _biometricAvailable = status.canUseBiometric;
        _biometricEnabled = status.isEnabled;
        // caso biometria esteja ativa, esconder botão manual inicialmente
        if (_biometricAvailable && _biometricEnabled && !_showManualLogin) {
          _showManualLogin = false;
        }
      });
      if (status.canUseBiometric && status.isEnabled) {
        _attemptAutoBiometricLogin();
      }
    }
  }

  void _attemptAutoBiometricLogin() {
    if (_autoBiometricAttempted || !_biometricAvailable || !_biometricEnabled) {
      return;
    }
    _autoBiometricAttempted = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loginWithBiometric(autoTriggered: true);
    });
  }

  @override
  void dispose() {
    for (var controller in _controllers.values) {
      controller.dispose();
    }
    super.dispose();
  }

  void _setError(String fieldName, String? error) {
    setState(() {
      _errors[fieldName] = error;
    });
  }

  void _setTouched(String fieldName) {
    setState(() {
      _touched[fieldName] = true;
    });
  }

  void _setSubmitting(bool submitting) {
    setState(() {
      _isSubmitting = submitting;
    });
  }

  Future<void> _onSubmit(Map<String, String> values) async {
    final authProvider = context.read<AuthProvider>();

    try {
      final success = await authProvider.login(
        email: values['email']!,
        password: values['password']!,
        saveForBiometric: _biometricEnabled,
      );

      if (success && mounted) {
        // Persistir/limpar credenciais conforme toggle
        await _persistLoginIfNeeded();
        if (!mounted) {
          return;
        }
        // Redirecionar para a tela principal do app com transição moderna
        final navigator = Navigator.of(context);
        navigator.pushReplacement(
          AppPageTransitions.slideAndFadeTransition(page: const MainScreen()),
        );
      } else if (mounted) {
        // Mostrar erro de login
        Fluttertoast.showToast(
          msg: 'Erro no login. Verifique suas credenciais e tente novamente.',
          toastLength: Toast.LENGTH_LONG,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.red,
          textColor: Colors.white,
        );
      }
    } catch (error) {
      // Mostrar erro apenas se o widget ainda estiver montado
      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Erro no login. Verifique suas credenciais e tente novamente.',
          toastLength: Toast.LENGTH_LONG,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.red,
          textColor: Colors.white,
        );
      }
    }
  }

  void _handleFieldChange(String fieldName) {
    _formHook.handleFieldChange(fieldName);
  }

  void _handleFieldBlur(String fieldName) {
    final rule = _validationRules[fieldName];
    if (rule != null) {
      _formHook.handleFieldBlur(fieldName, rule);
    }
  }

  Future<void> _loginWithBiometric({bool autoTriggered = false}) async {
    final authProvider = context.read<AuthProvider>();

    setState(() {
      _isSubmitting = true;
    });

    try {
      final success = await authProvider.loginWithBiometric();

      if (!mounted) {
        return;
      }

      if (success) {
        final navigator = Navigator.of(context);
        navigator.pushReplacement(
          AppPageTransitions.slideAndFadeTransition(page: const MainScreen()),
        );
      } else {
        if (autoTriggered) {
          setState(() {
            _showManualLogin = true;
          });
        }
        Fluttertoast.showToast(
          msg: 'Erro no login biométrico. Verifique suas configurações.',
          toastLength: Toast.LENGTH_LONG,
          gravity: ToastGravity.BOTTOM,
          backgroundColor: Colors.red,
          textColor: Colors.white,
        );
      }
    } catch (error) {
      if (!mounted) {
        return;
      }
      if (autoTriggered) {
        setState(() {
          _showManualLogin = true;
        });
      }
      Fluttertoast.showToast(
        msg: 'Erro no login biométrico. Verifique suas configurações.',
        toastLength: Toast.LENGTH_LONG,
        gravity: ToastGravity.BOTTOM,
        backgroundColor: Colors.red,
        textColor: Colors.white,
      );
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return ConnectivityBanner(
      child: Scaffold(
        backgroundColor: Colors.black,
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 32.0),
            child: ConstrainedBox(
              constraints: BoxConstraints(
                minHeight: () {
                  final height = MediaQuery.of(context).size.height;
                  final topPadding = MediaQuery.of(context).padding.top;
                  final bottomPadding = MediaQuery.of(context).padding.bottom;
                  final result = height - topPadding - bottomPadding;
                  // Garantir que o resultado não seja NaN ou negativo
                  return result.isFinite && result > 0 ? result : 600.0;
                }(),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Conteúdo Principal centralizado
                    Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        // Logo
                        Column(
                          children: [
                            LayoutBuilder(
                              builder: (context, constraints) {
                                final maxW = MediaQuery.of(context).size.width;
                                // Garantir que maxW é válido antes de calcular
                                final safeWidth = maxW.isFinite && maxW > 0
                                    ? maxW
                                    : 375.0;
                                final calculatedSize = safeWidth * 0.4;
                                final size = calculatedSize.isFinite
                                    ? calculatedSize.clamp(140.0, 320.0)
                                    : 200.0;
                                // Validar aspectRatio para evitar NaN
                                const aspectRatioValue =
                                    1190.15 / 726.12; // ~1.64
                                final safeAspectRatio =
                                    aspectRatioValue.isFinite
                                    ? aspectRatioValue
                                    : 1.0;

                                return SizedBox(
                                  width: size,
                                  height: size / safeAspectRatio,
                                  child: SvgPicture.asset(
                                    'assets/icone-logo-granobox.svg',
                                    fit: BoxFit.contain,
                                  ),
                                );
                              },
                            ),
                            const SizedBox(height: 0),
                            Text(
                              'Smart Tag. Smart Food.',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primary,
                                letterSpacing: 0.5,
                              ),
                            ),
                            const SizedBox(height: 6),
                          ],
                        ),

                        const SizedBox(height: 40),

                        // Formulário de Login
                        Form(
                          child: Column(
                            children: [
                              FormInput(
                                label: 'Email',
                                icon: PhosphorIcons.envelope,
                                controller: _controllers['email'],
                                keyboardType: TextInputType.emailAddress,
                                error: _touched['email'] == true
                                    ? _errors['email']
                                    : null,
                                hasError:
                                    _touched['email'] == true &&
                                    _errors['email'] != null,
                                onChanged: (value) =>
                                    _handleFieldChange('email'),
                                onEditingComplete: () =>
                                    _handleFieldBlur('email'),
                              ),

                              const SizedBox(height: 24),

                              FormInput(
                                label: 'Senha',
                                icon: PhosphorIcons.lock,
                                suffixIcon: _showPassword
                                    ? PhosphorIcons.eyeSlash
                                    : PhosphorIcons.eye,
                                onSuffixIconTap: () {
                                  setState(() {
                                    _showPassword = !_showPassword;
                                  });
                                },
                                controller: _controllers['password'],
                                obscureText: !_showPassword,
                                error: _touched['password'] == true
                                    ? _errors['password']
                                    : null,
                                hasError:
                                    _touched['password'] == true &&
                                    _errors['password'] != null,
                                onChanged: (value) =>
                                    _handleFieldChange('password'),
                                onEditingComplete: () =>
                                    _handleFieldBlur('password'),
                              ),

                              const SizedBox(height: 32),

                              // Lembrar login (toggle)
                              Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text(
                                    'Lembrar login',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  Switch(
                                    value: _rememberLogin,
                                    thumbColor:
                                        WidgetStateProperty.resolveWith<Color?>(
                                          (states) {
                                            if (states.contains(
                                              WidgetState.selected,
                                            )) {
                                              return AppTheme.primary;
                                            }
                                            return null;
                                          },
                                        ),
                                    trackColor:
                                        WidgetStateProperty.resolveWith<Color?>(
                                          (states) {
                                            if (states.contains(
                                              WidgetState.selected,
                                            )) {
                                              return AppTheme.primary
                                                  .withValues(alpha: 0.4);
                                            }
                                            return null;
                                          },
                                        ),
                                    onChanged: (v) async {
                                      setState(() {
                                        _rememberLogin = v;
                                      });
                                      // Se desativar, limpar imediatamente
                                      if (!v) {
                                        await _persistLoginIfNeeded();
                                      }
                                    },
                                  ),
                                ],
                              ),
                              const SizedBox(height: 12),

                              if (!_biometricAvailable ||
                                  !_biometricEnabled ||
                                  _showManualLogin) ...[
                                SizedBox(
                                  width: double.infinity,
                                  height: 56,
                                  child: ElevatedButton(
                                    onPressed: _isSubmitting
                                        ? null
                                        : () async {
                                            await _formHook.handleSubmit(
                                              _validationRules,
                                              _onSubmit,
                                            );
                                          },
                                    child: _isSubmitting
                                        ? const SizedBox(
                                            width: 24,
                                            height: 24,
                                            child: CircularProgressIndicator(
                                              color: Colors.white,
                                              strokeWidth: 2,
                                            ),
                                          )
                                        : const Text(
                                            'Entrar',
                                            style: TextStyle(
                                              fontSize: 16,
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                  ),
                                ),
                              ],

                              if (_biometricAvailable && _biometricEnabled) ...[
                                const SizedBox(height: 16),
                                SizedBox(
                                  width: double.infinity,
                                  height: 56,
                                  child: OutlinedButton.icon(
                                    onPressed: _isSubmitting
                                        ? null
                                        : () => _loginWithBiometric(),
                                    icon: Icon(
                                      PhosphorIcons.fingerprint,
                                      color: AppTheme.primary,
                                    ),
                                    label: Text(
                                      'Entrar com Biometria',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                    style: OutlinedButton.styleFrom(
                                      side: BorderSide(color: AppTheme.primary),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                    ),
                                  ),
                                ),
                                if (!_showManualLogin) ...[
                                  const SizedBox(height: 12),
                                  TextButton(
                                    onPressed: _isSubmitting
                                        ? null
                                        : () {
                                            setState(() {
                                              _showManualLogin = true;
                                            });
                                          },
                                    child: Text(
                                      'Entrar com e-mail e senha',
                                      style: TextStyle(
                                        color: AppTheme.light600,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ],
                          ),
                        ),

                        const SizedBox(height: 24),

                        // Links de Ajuda
                        TextButton(
                          onPressed: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) =>
                                    const ForgotPasswordScreen(),
                              ),
                            );
                          },
                          child: Text(
                            'Esqueceu sua senha?',
                            style: TextStyle(
                              color: AppTheme.light600,
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),

                    // Footer removido para manter fundo preto sem elementos
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
