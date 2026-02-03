import 'package:flutter/services.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

class BiometricService {
  static final LocalAuthentication _localAuth = LocalAuthentication();

  /// Verificar se a biometria está disponível no dispositivo
  static Future<bool> isBiometricAvailable() async {
    try {
      final bool canCheck = await _localAuth.canCheckBiometrics;
      final bool isDeviceSupported = await _localAuth.isDeviceSupported();

      print('🔐 BiometricService - canCheckBiometrics: $canCheck');
      print('🔐 BiometricService - isDeviceSupported: $isDeviceSupported');

      return canCheck && isDeviceSupported;
    } on PlatformException catch (e) {
      print('❌ BiometricService - PlatformException ao verificar disponibilidade: ${e.code}');
      return false;
    } catch (e) {
      print('❌ BiometricService - Erro ao verificar disponibilidade: $e');
      return false;
    }
  }

  /// Obter tipos de biometria disponíveis
  static Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      final biometrics = await _localAuth.getAvailableBiometrics();
      print('🔐 BiometricService - Tipos disponíveis: $biometrics');
      return biometrics;
    } on PlatformException catch (e) {
      print('❌ BiometricService - PlatformException ao obter tipos: ${e.code}');
      return [];
    } catch (e) {
      print('❌ BiometricService - Erro ao obter tipos: $e');
      return [];
    }
  }

  /// Verificar se a biometria está habilitada nas configurações
  static Future<bool> isBiometricEnabled() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('biometric_enabled') ?? false;
    } catch (e) {
      return false;
    }
  }

  /// Habilitar/desabilitar biometria nas configurações
  static Future<bool> setBiometricEnabled(bool enabled) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return await prefs.setBool('biometric_enabled', enabled);
    } catch (e) {
      return false;
    }
  }

  /// Salvar credenciais para login biométrico
  static Future<bool> saveCredentialsForBiometric({
    required String email,
    required String password,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('biometric_email', email);
      await prefs.setString('biometric_password', password);
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Obter credenciais salvas para login biométrico
  static Future<Map<String, String>?> getCredentialsForBiometric() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final email = prefs.getString('biometric_email');
      final password = prefs.getString('biometric_password');
      
      if (email != null && password != null) {
        return {
          'email': email,
          'password': password,
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Limpar credenciais salvas
  static Future<bool> clearBiometricCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('biometric_email');
      await prefs.remove('biometric_password');
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Autenticar usando biometria
  static Future<bool> authenticateWithBiometric({
    String? reason,
  }) async {
    try {
      final bool isAvailable = await isBiometricAvailable();
      if (!isAvailable) {
        return false;
      }

      final bool authenticated = await _localAuth.authenticate(
        localizedReason: reason ?? 'Toque no sensor para fazer login',
        options: const AuthenticationOptions(
          biometricOnly: false,
          stickyAuth: true,
          useErrorDialogs: true,
          sensitiveTransaction: false,
        ),
      );

      return authenticated;
    } on PlatformException catch (e) {
      print('❌ BiometricService - PlatformException na autenticação: ${e.code}');
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Verificar se o dispositivo tem biometria configurada
  static Future<bool> hasBiometricEnrolled() async {
    try {
      final List<BiometricType> availableBiometrics = await getAvailableBiometrics();
      return availableBiometrics.isNotEmpty;
    } catch (e) {
      return false;
    }
  }

  /// Obter texto amigável do tipo de biometria
  static String getBiometricTypeText(List<BiometricType> biometricTypes) {
    if (biometricTypes.isEmpty) {
      return 'Biometria não disponível';
    }

    if (biometricTypes.contains(BiometricType.fingerprint)) {
      return 'Impressão digital';
    } else if (biometricTypes.contains(BiometricType.face)) {
      return 'Reconhecimento facial';
    } else if (biometricTypes.contains(BiometricType.iris)) {
      return 'Reconhecimento de íris';
    } else {
      return 'Biometria disponível';
    }
  }

  /// Verificar status completo da biometria
  static Future<BiometricStatus> getBiometricStatus() async {
    try {
      final bool isAvailable = await isBiometricAvailable();
      final bool hasEnrolled = await hasBiometricEnrolled();
      final bool isEnabled = await isBiometricEnabled();
      final List<BiometricType> availableTypes = await getAvailableBiometrics();

      print('🔐 BiometricService - Status completo:');
      print('   - isAvailable: $isAvailable');
      print('   - hasEnrolled: $hasEnrolled');
      print('   - isEnabled: $isEnabled');
      print('   - availableTypes: $availableTypes');

      return BiometricStatus(
        isAvailable: isAvailable,
        hasEnrolled: hasEnrolled,
        isEnabled: isEnabled,
        availableTypes: availableTypes,
      );
    } catch (e) {
      print('❌ BiometricService - Erro ao obter status: $e');
      return BiometricStatus(
        isAvailable: false,
        hasEnrolled: false,
        isEnabled: false,
        availableTypes: [],
      );
    }
  }
}

class BiometricStatus {
  final bool isAvailable;
  final bool hasEnrolled;
  final bool isEnabled;
  final List<BiometricType> availableTypes;

  BiometricStatus({
    required this.isAvailable,
    required this.hasEnrolled,
    required this.isEnabled,
    required this.availableTypes,
  });

  Map<String, dynamic> toJson() => {
        'isAvailable': isAvailable,
        'hasEnrolled': hasEnrolled,
        'isEnabled': isEnabled,
        'availableTypes': availableTypes.map((e) => e.name).toList(),
      };

  // ✅ CORRIGIDO: Pode usar biometria se estiver disponível E tiver biometria cadastrada
  // Não precisa estar "enabled" para mostrar a opção (apenas para funcionar no login)
  bool get canUseBiometric => isAvailable && hasEnrolled;
  
  String get statusText {
    if (!isAvailable) {
      return 'Biometria não disponível neste dispositivo';
    }
    if (!hasEnrolled) {
      return 'Configure a biometria nas configurações do dispositivo';
    }
    if (!isEnabled) {
      return 'Biometria desabilitada nas configurações do app';
    }
    return BiometricService.getBiometricTypeText(availableTypes);
  }
}
