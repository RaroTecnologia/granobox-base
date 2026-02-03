import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Serviço de cache inteligente com diferentes estratégias
class SmartCacheService {
  static const String _cachePrefix = 'smart_cache_';
  static const String _metadataKey = 'cache_metadata';
  
  // Configurações de TTL por tipo de dados
  static const Map<String, Duration> _cacheTTL = {
    'categories': Duration(hours: 2),
    'products': Duration(hours: 1),
    'operators': Duration(hours: 24),
    'printers': Duration(days: 7),
    'auth': Duration(days: 30),
  };

  /// Salvar dados no cache com metadados
  static Future<void> saveData({
    required String key,
    required dynamic data,
    required String type,
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final timestamp = DateTime.now().toIso8601String();
      
      final cacheData = {
        'data': data,
        'timestamp': timestamp,
        'type': type,
        'metadata': metadata ?? {},
        'version': '1.0',
      };
      
      await prefs.setString('$_cachePrefix$key', jsonEncode(cacheData));
      
      // Atualizar metadados
      await _updateMetadata(key, type, timestamp);
      
      print('💾 Cache salvo: $key (${data.runtimeType})');
    } catch (e) {
      print('❌ Erro ao salvar cache: $e');
    }
  }

  /// Carregar dados do cache
  static Future<T?> loadData<T>({
    required String key,
    required String type,
    bool checkTTL = true,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheJson = prefs.getString('$_cachePrefix$key');
      
      if (cacheJson == null) {
        print('📦 Cache não encontrado: $key');
        return null;
      }
      
      final cacheData = jsonDecode(cacheJson) as Map<String, dynamic>;
      
      // Verificar TTL se necessário
      if (checkTTL) {
        final timestamp = DateTime.parse(cacheData['timestamp']);
        final ttl = _cacheTTL[type] ?? Duration(hours: 1);
        
        if (DateTime.now().difference(timestamp) > ttl) {
          print('📦 Cache expirado: $key (${DateTime.now().difference(timestamp).inMinutes}min)');
          await _removeData(key);
          return null;
        }
      }
      
      print('📦 Cache carregado: $key (${DateTime.now().difference(DateTime.parse(cacheData['timestamp'])).inMinutes}min atrás)');
      return cacheData['data'] as T;
    } catch (e) {
      print('❌ Erro ao carregar cache: $e');
      return null;
    }
  }

  /// Verificar se cache existe e é válido
  static Future<bool> isCacheValid({
    required String key,
    required String type,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheJson = prefs.getString('$_cachePrefix$key');
      
      if (cacheJson == null) return false;
      
      final cacheData = jsonDecode(cacheJson) as Map<String, dynamic>;
      final timestamp = DateTime.parse(cacheData['timestamp']);
      final ttl = _cacheTTL[type] ?? Duration(hours: 1);
      
      return DateTime.now().difference(timestamp) <= ttl;
    } catch (e) {
      return false;
    }
  }

  /// Obter idade do cache em minutos
  static Future<int?> getCacheAge(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final cacheJson = prefs.getString('$_cachePrefix$key');
      
      if (cacheJson == null) return null;
      
      final cacheData = jsonDecode(cacheJson) as Map<String, dynamic>;
      final timestamp = DateTime.parse(cacheData['timestamp']);
      
      return DateTime.now().difference(timestamp).inMinutes;
    } catch (e) {
      return null;
    }
  }

  /// Limpar cache por tipo
  static Future<void> clearCacheByType(String type) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      for (final key in keys) {
        if (key.startsWith(_cachePrefix)) {
          final cacheJson = prefs.getString(key);
          if (cacheJson != null) {
            final cacheData = jsonDecode(cacheJson) as Map<String, dynamic>;
            if (cacheData['type'] == type) {
              await prefs.remove(key);
              print('🗑️ Cache removido: $key');
            }
          }
        }
      }
      
      await _updateMetadata(null, type, null);
    } catch (e) {
      print('❌ Erro ao limpar cache por tipo: $e');
    }
  }

  /// Limpar todo o cache
  static Future<void> clearAllCache() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      for (final key in keys) {
        if (key.startsWith(_cachePrefix) || key == _metadataKey) {
          await prefs.remove(key);
        }
      }
      
      print('🗑️ Todo o cache foi limpo');
    } catch (e) {
      print('❌ Erro ao limpar todo o cache: $e');
    }
  }

  /// Obter estatísticas do cache
  static Future<Map<String, dynamic>> getCacheStats() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys();
      
      final stats = <String, dynamic>{
        'total_entries': 0,
        'by_type': <String, int>{},
        'oldest_entry': null,
        'newest_entry': null,
      };
      
      DateTime? oldest, newest;
      
      for (final key in keys) {
        if (key.startsWith(_cachePrefix)) {
          final cacheJson = prefs.getString(key);
          if (cacheJson != null) {
            final cacheData = jsonDecode(cacheJson) as Map<String, dynamic>;
            final type = cacheData['type'] as String;
            final timestamp = DateTime.parse(cacheData['timestamp']);
            
            stats['total_entries'] = (stats['total_entries'] as int) + 1;
            stats['by_type'][type] = (stats['by_type'][type] ?? 0) + 1;
            
            if (oldest == null || timestamp.isBefore(oldest)) {
              oldest = timestamp;
            }
            if (newest == null || timestamp.isAfter(newest)) {
              newest = timestamp;
            }
          }
        }
      }
      
      stats['oldest_entry'] = oldest?.toIso8601String();
      stats['newest_entry'] = newest?.toIso8601String();
      
      return stats;
    } catch (e) {
      print('❌ Erro ao obter estatísticas: $e');
      return {};
    }
  }

  /// Atualizar metadados do cache
  static Future<void> _updateMetadata(String? key, String type, String? timestamp) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final metadataJson = prefs.getString(_metadataKey);
      
      Map<String, dynamic> metadata = {};
      if (metadataJson != null) {
        metadata = jsonDecode(metadataJson) as Map<String, dynamic>;
      }
      
      if (key != null && timestamp != null) {
        if (!metadata.containsKey(type)) {
          metadata[type] = {};
        }
        metadata[type][key] = timestamp;
      } else if (key == null) {
        // Limpar tipo inteiro
        metadata.remove(type);
      }
      
      await prefs.setString(_metadataKey, jsonEncode(metadata));
    } catch (e) {
      print('❌ Erro ao atualizar metadados: $e');
    }
  }

  /// Remover dados específicos
  static Future<void> _removeData(String key) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('$_cachePrefix$key');
    } catch (e) {
      print('❌ Erro ao remover dados: $e');
    }
  }
}
