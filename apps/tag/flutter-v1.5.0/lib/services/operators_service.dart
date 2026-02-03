import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/operator_models.dart';
import '../config/app_config.dart';

/// Serviço para gerenciar operadores com cache
class OperatorsService {
  static const String _cacheKey = 'operators_cache';
  static const Duration _cacheTTL = Duration(hours: 24);

  /// Buscar operadores da API
  Future<List<Operator>> getOperators({
    required String clientId,
    required String authToken,
    bool forceRefresh = false,
  }) async {
    try {
      // 1. Verificar cache primeiro (se não forçar refresh)
      if (!forceRefresh) {
        final cachedOperators = await _getCachedOperators(clientId);
        if (cachedOperators != null && cachedOperators.isNotEmpty) {
          print('📦 Operadores carregados do cache: ${cachedOperators.length}');
          return cachedOperators;
        }
      }

      // 2. Buscar da API
      print('🌐 Buscando operadores da API...');
      final operators = await _fetchOperatorsFromAPI(clientId, authToken);
      
      // 3. Salvar no cache
      await _saveOperatorsToCache(operators, clientId);
      
      print('✅ Operadores carregados da API: ${operators.length}');
      return operators;

    } catch (e) {
      print('❌ Erro ao buscar operadores: $e');
      
      // 4. Fallback para cache (mesmo se expirado)
      final cachedOperators = await _getCachedOperators(clientId, ignoreExpiration: true);
      if (cachedOperators != null && cachedOperators.isNotEmpty) {
        print('⚠️ Usando cache expirado como fallback: ${cachedOperators.length}');
        return cachedOperators;
      }
      
      rethrow;
    }
  }

  /// Buscar operadores da API
  Future<List<Operator>> _fetchOperatorsFromAPI(String clientId, String authToken) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}/operators?clientId=$clientId');
    
    final response = await http.get(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final jsonData = json.decode(response.body);
      
      if (jsonData is List) {
        // Resposta é uma lista direta
        return jsonData.map((item) {
          if (item is Map<String, dynamic>) {
            // Mapear accessLevel -> role para compatibilidade do app
            if (item.containsKey('accessLevel') && !item.containsKey('role')) {
              item['role'] = item['accessLevel'];
            }
          }
          return Operator.fromJson(item);
        }).toList();
      } else if (jsonData is Map<String, dynamic>) {
        // Resposta tem estrutura de paginação
        if (jsonData.containsKey('operators')) {
          final operatorsList = jsonData['operators'] as List;
          return operatorsList.map((item) {
            if (item is Map<String, dynamic>) {
              if (item.containsKey('accessLevel') && !item.containsKey('role')) {
                item['role'] = item['accessLevel'];
              }
            }
            return Operator.fromJson(item);
          }).toList();
        } else if (jsonData.containsKey('data')) {
          final operatorsList = jsonData['data'] as List;
          return operatorsList.map((item) {
            if (item is Map<String, dynamic>) {
              if (item.containsKey('accessLevel') && !item.containsKey('role')) {
                item['role'] = item['accessLevel'];
              }
            }
            return Operator.fromJson(item);
          }).toList();
        }
      }
      
      throw Exception('Formato de resposta inesperado da API');
    } else if (response.statusCode == 404) {
      // Nenhum operador encontrado - retornar lista vazia
      return [];
    } else {
      throw Exception('Erro ${response.statusCode}: ${response.body}');
    }
  }

  /// Obter operadores do cache
  Future<List<Operator>?> _getCachedOperators(String clientId, {bool ignoreExpiration = false}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheJson = prefs.getString(_cacheKey);
      
      if (cacheJson == null) {
        print('📦 Nenhum cache de operadores encontrado');
        return null;
      }

      final cache = OperatorsCache.fromJson(json.decode(cacheJson));
      
      // Verificar se é para o cliente correto
      if (!cache.isForClient(clientId)) {
        print('📦 Cache de operadores é para outro cliente');
        return null;
      }

      // Verificar se ainda é válido (se não ignorar expiração)
      if (!ignoreExpiration && !cache.isValid) {
        print('📦 Cache de operadores expirado');
        return null;
      }

      print('📦 Cache de operadores válido (${cache.cachedAt})');
      return cache.operators;

    } catch (e) {
      print('❌ Erro ao ler cache de operadores: $e');
      return null;
    }
  }

  /// Salvar operadores no cache
  Future<void> _saveOperatorsToCache(List<Operator> operators, String clientId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cache = OperatorsCache(
        operators: operators,
        cachedAt: DateTime.now(),
        clientId: clientId,
      );
      
      final cacheJson = json.encode(cache.toJson());
      await prefs.setString(_cacheKey, cacheJson);
      
      print('💾 Operadores salvos no cache: ${operators.length}');

    } catch (e) {
      print('❌ Erro ao salvar cache de operadores: $e');
    }
  }

  /// Limpar cache de operadores
  Future<void> clearCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_cacheKey);
      print('🗑️ Cache de operadores limpo');
    } catch (e) {
      print('❌ Erro ao limpar cache de operadores: $e');
    }
  }

  /// Verificar se há cache válido
  Future<bool> hasValidCache(String clientId) async {
    final cachedOperators = await _getCachedOperators(clientId);
    return cachedOperators != null && cachedOperators.isNotEmpty;
  }

  /// Obter informações do cache
  Future<Map<String, dynamic>?> getCacheInfo(String clientId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheJson = prefs.getString(_cacheKey);
      
      if (cacheJson == null) return null;

      final cache = OperatorsCache.fromJson(json.decode(cacheJson));
      
      if (!cache.isForClient(clientId)) return null;

      return {
        'operatorsCount': cache.operators.length,
        'cachedAt': cache.cachedAt.toIso8601String(),
        'isValid': cache.isValid,
        'age': DateTime.now().difference(cache.cachedAt).inHours,
      };

    } catch (e) {
      print('❌ Erro ao obter informações do cache: $e');
      return null;
    }
  }

  /// Criar operador
  Future<Operator> createOperator({
    required String clientId,
    required String authToken,
    required CreateOperatorRequest request,
  }) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}/operators');
    
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: json.encode(() {
        final payload = {...request.toJson(), 'clientId': clientId};
        // Mapear role -> accessLevel para API
        if (payload.containsKey('role')) {
          payload['accessLevel'] = payload['role'];
          payload.remove('role');
        }
        return payload;
      }()),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      if (data is Map<String, dynamic>) {
        if (data.containsKey('accessLevel') && !data.containsKey('role')) {
          data['role'] = data['accessLevel'];
        }
      }
      final operator = Operator.fromJson(data);
      print('✅ Operador criado: ${operator.name}');
      return operator;
    } else {
      throw Exception('Erro ${response.statusCode}: ${response.body}');
    }
  }

  /// Atualizar operador
  Future<Operator> updateOperator({
    required String operatorId,
    required String authToken,
    required UpdateOperatorRequest request,
  }) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}/operators/$operatorId');
    
    final response = await http.patch( // ✅ CORRIGIDO: PUT → PATCH
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: json.encode(() {
        final payload = {...request.toJson()};
        if (payload.containsKey('role')) {
          payload['accessLevel'] = payload['role'];
          payload.remove('role');
        }
        return payload;
      }()),
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      if (data is Map<String, dynamic>) {
        if (data.containsKey('accessLevel') && !data.containsKey('role')) {
          data['role'] = data['accessLevel'];
        }
      }
      final operator = Operator.fromJson(data);
      print('✅ Operador atualizado: ${operator.name}');
      return operator;
    } else {
      throw Exception('Erro ${response.statusCode}: ${response.body}');
    }
  }

  /// Deletar operador
  Future<void> deleteOperator({
    required String operatorId,
    required String authToken,
  }) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}/operators/$operatorId');
    
    final response = await http.delete(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
    ).timeout(const Duration(seconds: 10));

    if (response.statusCode == 200 || response.statusCode == 204) {
      print('✅ Operador deletado: $operatorId');
    } else {
      throw Exception('Erro ${response.statusCode}: ${response.body}');
    }
  }

  /// Validar PIN do operador
  Future<bool> validatePin({
    required String operatorId,
    required String pin,
    required String authToken,
  }) async {
    final url = Uri.parse('${AppConfig.apiBaseUrl}/operators/$operatorId/validate-pin');
    
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $authToken',
      },
      body: json.encode({'pin': pin}),
    ).timeout(const Duration(seconds: 5));

    if (response.statusCode == 200) {
      final result = json.decode(response.body);
      return result['valid'] == true;
    } else {
      return false;
    }
  }
}


