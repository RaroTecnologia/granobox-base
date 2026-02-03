import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import 'dart:io' show Platform;
import 'package:device_info_plus/device_info_plus.dart';
import 'package:package_info_plus/package_info_plus.dart';
import '../theme/app_theme.dart';
import 'tagment_printers_config_screen.dart';
import 'login_screen.dart';
import 'rotulo_screen.dart';
import '../services/biometric_service.dart';
import '../services/environment_service.dart';
import '../components/date_config_widget.dart';
import '../providers/date_config_provider.dart';
import '../providers/print_config_provider.dart';
import 'operators_management_screen.dart';
import 'users_management_screen.dart';
import 'dots_config_screen.dart';
import 'devices_screen.dart';

class ConfigScreen extends StatefulWidget {
  const ConfigScreen({super.key});

  @override
  State<ConfigScreen> createState() => _ConfigScreenState();
}

class _ConfigScreenState extends State<ConfigScreen> {
  bool _notificacoesAtivas = true;
  bool _somAtivo = true;
  String _impressoraSelecionada = 'Zebra ZD420';
  bool _biometricEnabled = false;
  bool _biometricAvailable = false;
  BiometricStatus? _biometricStatus; // ✅ NOVO: Status completo da biometria
  
  // Informações do app e dispositivo
  String _appVersion = 'Carregando...';
  String _buildNumber = 'Carregando...';
  String _platform = 'Carregando...';
  String _deviceModel = 'Carregando...';
  String _deviceManufacturer = 'Carregando...';
  String _androidVersion = 'Carregando...';
  
  // ⭐ Easter egg - modo desenvolvedor
  int _versionTapCount = 0;
  DateTime? _lastVersionTap;
  static const int _tapsToUnlock = 7;

  @override
  void initState() {
    super.initState();
    _loadBiometricStatus();
    _loadDeviceInfo();
  }
  
  Future<void> _loadDeviceInfo() async {
    try {
      // Informações do app
      final packageInfo = await PackageInfo.fromPlatform();
      
      // Informações do dispositivo
      final deviceInfo = DeviceInfoPlugin();
      
      if (Platform.isAndroid) {
        final androidInfo = await deviceInfo.androidInfo;
        setState(() {
          _appVersion = packageInfo.version;
          _buildNumber = packageInfo.buildNumber;
          _platform = 'Android ${androidInfo.version.release}';
          _deviceModel = androidInfo.model;
          _deviceManufacturer = androidInfo.manufacturer;
          _androidVersion = 'API ${androidInfo.version.sdkInt}';
        });
      } else if (Platform.isIOS) {
        final iosInfo = await deviceInfo.iosInfo;
        setState(() {
          _appVersion = packageInfo.version;
          _buildNumber = packageInfo.buildNumber;
          _platform = 'iOS ${iosInfo.systemVersion}';
          _deviceModel = iosInfo.model;
          _deviceManufacturer = 'Apple';
          _androidVersion = '-';
        });
      }
    } catch (e) {
      print('❌ Erro ao carregar informações do dispositivo: $e');
    }
  }

  Future<void> _loadBiometricStatus() async {
    final status = await BiometricService.getBiometricStatus();
    debugPrint('🔐 ConfigScreen - biometric status: ${status.toJson()}');
    if (!mounted) return;

    setState(() {
      _biometricStatus = status;
      _biometricEnabled = status.isEnabled;
      _biometricAvailable = status.canUseBiometric;
    });
  }

  /// ⭐ Easter egg - detectar taps na versão
  void _onVersionTap() {
    final now = DateTime.now();
    
    // Resetar contador se passou mais de 2 segundos desde o último tap
    if (_lastVersionTap != null && now.difference(_lastVersionTap!).inSeconds > 2) {
      _versionTapCount = 0;
    }
    
    _lastVersionTap = now;
    _versionTapCount++;
    
    // Feedback sutil quando está chegando perto
    if (_versionTapCount >= 5 && _versionTapCount < _tapsToUnlock) {
      final remaining = _tapsToUnlock - _versionTapCount;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('$remaining taps restantes...'),
          duration: const Duration(milliseconds: 500),
          backgroundColor: AppTheme.dark700,
        ),
      );
    }
    
    // Desbloquear modo desenvolvedor
    if (_versionTapCount >= _tapsToUnlock) {
      _versionTapCount = 0;
      _showDeveloperOptions();
    }
  }
  
  /// ⭐ Modal de opções de desenvolvedor
  Future<void> _showDeveloperOptions() async {
    // Habilitar modo desenvolvedor automaticamente
    await EnvironmentService.enableDeveloperMode();
    
    if (!mounted) return;
    
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => StatefulBuilder(
        builder: (context, setModalState) {
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.orange.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        PhosphorIcons.wrench,
                        color: Colors.orange,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Modo Desenvolvedor',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  'Opções avançadas para desenvolvimento e testes',
                  style: TextStyle(color: AppTheme.dark300, fontSize: 14),
                ),
                const SizedBox(height: 24),
                
                // Seletor de ambiente
                const Text(
                  'AMBIENTE',
                  style: TextStyle(
                    color: AppTheme.dark400,
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 12),
                
                // Opção Produção
                _buildEnvironmentOption(
                  context,
                  setModalState,
                  environment: AppEnvironment.production,
                  title: 'Produção',
                  subtitle: 'api.granobox.com.br',
                  icon: PhosphorIcons.globe,
                  color: Colors.green,
                ),
                const SizedBox(height: 8),
                
                // Opção Staging
                _buildEnvironmentOption(
                  context,
                  setModalState,
                  environment: AppEnvironment.staging,
                  title: 'Staging',
                  subtitle: 'staging.granobox.com.br',
                  icon: PhosphorIcons.flask,
                  color: Colors.orange,
                ),
                
                const SizedBox(height: 24),
                
                // Aviso de reinicialização
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(PhosphorIcons.info, color: Colors.blue, size: 20),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Reinicie o app para aplicar as alterações',
                          style: TextStyle(color: Colors.blue, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
                
                const SizedBox(height: 16),
                
                // Botão para desabilitar modo dev
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () async {
                      await EnvironmentService.disableDeveloperMode();
                      if (mounted) {
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Modo desenvolvedor desabilitado'),
                            backgroundColor: Colors.grey,
                          ),
                        );
                      }
                    },
                    child: const Text(
                      'Desabilitar Modo Desenvolvedor',
                      style: TextStyle(color: AppTheme.dark400),
                    ),
                  ),
                ),
                
                const SizedBox(height: 8),
              ],
            ),
          );
        },
      ),
    );
  }
  
  Widget _buildEnvironmentOption(
    BuildContext context,
    StateSetter setModalState, {
    required AppEnvironment environment,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    final isSelected = EnvironmentService.currentEnvironment == environment;
    
    return GestureDetector(
      onTap: () async {
        await EnvironmentService.setEnvironment(environment);
        setModalState(() {});
        setState(() {});
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.15) : AppTheme.dark700,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? color : AppTheme.dark600,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            Icon(icon, color: isSelected ? color : AppTheme.dark400, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isSelected ? color : Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: TextStyle(
                      color: isSelected ? color.withOpacity(0.7) : AppTheme.dark400,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(PhosphorIcons.checkCircle, color: color, size: 24),
          ],
        ),
      ),
    );
  }

  Future<void> _toggleBiometric(bool enabled) async {
    if (enabled) {
      // Testar biometria antes de habilitar
      final authenticated = await BiometricService.authenticateWithBiometric(
        reason: 'Confirme sua identidade para habilitar o login biométrico',
      );
      
      if (authenticated) {
        // ✅ Salvar nas preferências
        await BiometricService.setBiometricEnabled(true);
        
        setState(() {
          _biometricEnabled = true;
        });
        await _loadBiometricStatus();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Login biométrico habilitado'),
            backgroundColor: Colors.green,
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Autenticação biométrica falhou'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } else {
      // ✅ Salvar nas preferências
      await BiometricService.setBiometricEnabled(false);
      await BiometricService.clearBiometricCredentials();
      
      setState(() {
        _biometricEnabled = false;
      });
      await _loadBiometricStatus();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Login biométrico desabilitado'),
          backgroundColor: Colors.orange,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark900,
        elevation: 0,
        title: const Text(
          'Configurações',
          style: TextStyle(
            color: Colors.white,
            fontSize: 20,
            fontWeight: FontWeight.w600,
          ),
        ),
        automaticallyImplyLeading: false, // Remove o botão de voltar automático
        actions: [],
      ),
      body: _buildBody(context),
    );
  }

  Widget _buildBody(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          
          // ⭐ Indicador de ambiente (apenas se dev mode estiver ativo e não for produção)
          if (EnvironmentService.isDeveloperModeEnabled && EnvironmentService.isStaging)
            Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.orange.withOpacity(0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.orange.withOpacity(0.5)),
              ),
              child: Row(
                children: [
                  const Icon(PhosphorIcons.flask, color: Colors.orange, size: 20),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'AMBIENTE STAGING',
                          style: TextStyle(
                            color: Colors.orange,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                        Text(
                          'staging.granobox.com.br',
                          style: TextStyle(
                            color: Colors.orange,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: _showDeveloperOptions,
                    child: const Icon(PhosphorIcons.gear, color: Colors.orange, size: 20),
                  ),
                ],
              ),
            ),

          // 👥 Gerenciamento de Operadores
          Container(
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.dark700),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        PhosphorIcons.users,
                        color: AppTheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Operadores',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Gerencie os operadores que têm acesso ao sistema.',
                  style: TextStyle(fontSize: 14, color: AppTheme.dark300),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const OperatorsManagementScreen(),
                        ),
                      );
                    },
                    icon: const Icon(PhosphorIcons.gear, size: 20),
                    label: const Text('Gerenciar Operadores'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // 👤 Gerenciamento de Usuários
          Container(
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.dark700),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        PhosphorIcons.userCircle,
                        color: AppTheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Usuários',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Gerencie os usuários e suas permissões no sistema.',
                  style: TextStyle(fontSize: 14, color: AppTheme.dark300),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const UsersManagementScreen(),
                        ),
                      );
                    },
                    icon: const Icon(PhosphorIcons.gear, size: 20),
                    label: const Text('Gerenciar Usuários'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),


          const SizedBox(height: 20),

          // Configurações de Dots
          Container(
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.dark700),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        PhosphorIcons.cpu,
                        color: AppTheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Dispositivos',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                const Text(
                  'Gerencie Edge-Go, Edge-Pro e Leitores Dot.',
                  style: TextStyle(fontSize: 14, color: AppTheme.dark300),
                ),
                const SizedBox(height: 16),
                
                // Todos os dispositivos em UMA tela
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const DevicesScreenTuya(),
                        ),
                      );
                    },
                    icon: const Icon(PhosphorIcons.deviceMobile, size: 20),
                    label: const Text('Gerenciar Dispositivos'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // REMOVIDO: Configurações de Datas (sempre exibir hora)
          // const DateConfigWidget(),

          // Configurações de Biometria
          Container(
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.dark700),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        PhosphorIcons.fingerprint,
                        color: AppTheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Biometria',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  _biometricStatus != null 
                      ? _biometricStatus!.statusText
                      : 'Verificando disponibilidade...',
                  style: TextStyle(
                    fontSize: 14, 
                    color: _biometricAvailable ? AppTheme.dark300 : Colors.orange,
                    fontWeight: _biometricAvailable ? FontWeight.normal : FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Login Biométrico',
                      style: TextStyle(
                        color: _biometricAvailable ? Colors.white : AppTheme.dark400,
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Switch(
                      value: _biometricEnabled,
                      onChanged: _biometricAvailable ? _toggleBiometric : null,
                      activeColor: AppTheme.primary,
                    ),
                  ],
                ),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // ⭐ Configurações de Impressão
          Consumer<PrintConfigProvider>(
            builder: (context, printConfigProvider, child) {
              return Container(
                decoration: BoxDecoration(
                  color: AppTheme.dark800,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.dark700),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.orange.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(
                            PhosphorIcons.printer,
                            color: Colors.orange,
                            size: 24,
                          ),
                        ),
                        const SizedBox(width: 12),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Configurações de Impressão',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.w600,
                                color: Colors.white,
                              ),
                            ),
                            Text(
                              'Personalize o comportamento da impressão',
                              style: TextStyle(
                                fontSize: 12,
                                color: AppTheme.dark300,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Toggle para alterar data na reimpressão
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: printConfigProvider.updateDateOnReprint 
                              ? Colors.orange 
                              : AppTheme.dark600,
                          width: printConfigProvider.updateDateOnReprint ? 2 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            PhosphorIcons.calendarCheck,
                            color: printConfigProvider.updateDateOnReprint 
                                ? Colors.orange 
                                : AppTheme.dark400,
                            size: 24,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Alterar Data na Reimpressão',
                                  style: TextStyle(
                                    color: printConfigProvider.updateDateOnReprint 
                                        ? Colors.orange 
                                        : Colors.white,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  printConfigProvider.updateDateOnReprint
                                      ? 'A data de manipulação será atualizada ao reimprimir'
                                      : 'A data de manipulação será mantida ao reimprimir',
                                  style: TextStyle(
                                    color: AppTheme.dark300,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: printConfigProvider.updateDateOnReprint,
                            onChanged: printConfigProvider.isLoading 
                                ? null 
                                : (value) async {
                                    await printConfigProvider.setUpdateDateOnReprint(value);
                                    if (mounted) {
                                      ScaffoldMessenger.of(context).showSnackBar(
                                        SnackBar(
                                          content: Text(
                                            value 
                                                ? '✅ Data será atualizada na reimpressão'
                                                : '✅ Data será mantida na reimpressão',
                                          ),
                                          backgroundColor: Colors.green,
                                          duration: const Duration(seconds: 2),
                                        ),
                                      );
                                    }
                                  },
                            activeColor: Colors.orange,
                            activeTrackColor: Colors.orange.withOpacity(0.3),
                            inactiveThumbColor: AppTheme.dark400,
                            inactiveTrackColor: AppTheme.dark600,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            },
          ),

          const SizedBox(height: 20),

          // Informações do App
          Container(
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.dark700),
            ),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        PhosphorIcons.info,
                        color: AppTheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Text(
                      'Informações do App',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                // ⭐ Versão clicável para easter egg
                GestureDetector(
                  onTap: _onVersionTap,
                  child: _buildInfoRow('Versão', _appVersion, PhosphorIcons.package),
                ),
                const SizedBox(height: 4),
                _buildInfoRow('Build', _buildNumber, PhosphorIcons.hash),
                const SizedBox(height: 4),
                _buildInfoRow('Plataforma', _platform, PhosphorIcons.androidLogo),
                const SizedBox(height: 4),
                _buildInfoRow('Dispositivo', '$_deviceManufacturer $_deviceModel', PhosphorIcons.deviceMobile),
                const SizedBox(height: 4),
                _buildInfoRow('Desenvolvido por', 'Wdezoito Tecnologia', PhosphorIcons.code),
              ],
            ),
          ),

          const SizedBox(height: 20),

          // Botão de Logout (mais discreto)
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              onPressed: () {
                Navigator.pushAndRemoveUntil(
                  context,
                  MaterialPageRoute(builder: (context) => const LoginScreen()),
                  (route) => false,
                );
              },
              icon: Icon(PhosphorIcons.signOut, size: 18),
              label: const Text('Sair da Conta'),
              style: OutlinedButton.styleFrom(
                foregroundColor: AppTheme.dark300,
                side: BorderSide(color: AppTheme.dark600),
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),

          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.dark700.withOpacity(0.3),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        children: [
          Icon(
            icon,
            color: AppTheme.dark400,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              label,
              style: TextStyle(
                color: AppTheme.dark300,
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}