import 'package:flutter/material.dart';
import '../services/smart_cache_service.dart';

/// Widget de configurações de cache
class CacheSettingsWidget extends StatefulWidget {
  const CacheSettingsWidget({Key? key}) : super(key: key);

  @override
  State<CacheSettingsWidget> createState() => _CacheSettingsWidgetState();
}

class _CacheSettingsWidgetState extends State<CacheSettingsWidget> {
  Map<String, dynamic> _cacheStats = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadCacheStats();
  }

  Future<void> _loadCacheStats() async {
    setState(() => _isLoading = true);
    
    try {
      final stats = await SmartCacheService.getCacheStats();
      setState(() {
        _cacheStats = stats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _clearAllCache() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Limpar Cache'),
        content: const Text('Tem certeza que deseja limpar todo o cache? Isso irá recarregar todos os dados da API.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Limpar'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await SmartCacheService.clearAllCache();
      await _loadCacheStats();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Cache limpo com sucesso!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  Future<void> _clearCacheByType(String type) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Limpar Cache de ${_getTypeDisplayName(type)}'),
        content: Text('Tem certeza que deseja limpar o cache de ${_getTypeDisplayName(type).toLowerCase()}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Limpar'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await SmartCacheService.clearCacheByType(type);
      await _loadCacheStats();
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Cache de ${_getTypeDisplayName(type).toLowerCase()} limpo!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  String _getTypeDisplayName(String type) {
    switch (type) {
      case 'categories':
        return 'Categorias';
      case 'products':
        return 'Produtos';
      case 'operators':
        return 'Operadores';
      case 'printers':
        return 'Impressoras';
      case 'auth':
        return 'Autenticação';
      default:
        return type;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Configurações de Cache'),
        backgroundColor: Colors.grey[900],
        foregroundColor: Colors.white,
      ),
      backgroundColor: Colors.grey[900],
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Estatísticas gerais
                  Card(
                    color: Colors.grey[800],
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Estatísticas do Cache',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceAround,
                            children: [
                              _buildStatCard(
                                'Total de Entradas',
                                '${_cacheStats['total_entries'] ?? 0}',
                                Icons.storage,
                                Colors.blue,
                              ),
                              _buildStatCard(
                                'Tipos de Dados',
                                '${(_cacheStats['by_type'] as Map?)?.length ?? 0}',
                                Icons.category,
                                Colors.green,
                              ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          if (_cacheStats['oldest_entry'] != null) ...[
                            Text(
                              'Entrada mais antiga: ${_formatDate(_cacheStats['oldest_entry'])}',
                              style: TextStyle(color: Colors.grey[300]),
                            ),
                            const SizedBox(height: 4),
                          ],
                          if (_cacheStats['newest_entry'] != null) ...[
                            Text(
                              'Entrada mais recente: ${_formatDate(_cacheStats['newest_entry'])}',
                              style: TextStyle(color: Colors.grey[300]),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Cache por tipo
                  Text(
                    'Cache por Tipo',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  if (_cacheStats['by_type'] != null)
                    ...(_cacheStats['by_type'] as Map<String, dynamic>).entries.map(
                      (entry) => _buildCacheTypeCard(entry.key, entry.value),
                    ),
                  
                  const SizedBox(height: 24),
                  
                  // Ações
                  Text(
                    'Ações',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _loadCacheStats,
                      icon: const Icon(Icons.refresh),
                      label: const Text('Atualizar Estatísticas'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.blue,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                  
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: _clearAllCache,
                      icon: const Icon(Icons.delete_forever),
                      label: const Text('Limpar Todo o Cache'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.red,
                        foregroundColor: Colors.white,
                      ),
                    ),
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Column(
      children: [
        Icon(icon, color: color, size: 32),
        const SizedBox(height: 8),
        Text(
          value,
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          title,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[400],
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildCacheTypeCard(String type, int count) {
    return Card(
      color: Colors.grey[800],
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(
          _getTypeIcon(type),
          color: _getTypeColor(type),
        ),
        title: Text(
          _getTypeDisplayName(type),
          style: const TextStyle(color: Colors.white),
        ),
        subtitle: Text(
          '$count entradas',
          style: TextStyle(color: Colors.grey[400]),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete, color: Colors.red),
          onPressed: () => _clearCacheByType(type),
          tooltip: 'Limpar cache de ${_getTypeDisplayName(type).toLowerCase()}',
        ),
      ),
    );
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'categories':
        return Icons.category;
      case 'products':
        return Icons.inventory;
      case 'operators':
        return Icons.person;
      case 'printers':
        return Icons.print;
      case 'auth':
        return Icons.security;
      default:
        return Icons.storage;
    }
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'categories':
        return Colors.green;
      case 'products':
        return Colors.blue;
      case 'operators':
        return Colors.orange;
      case 'printers':
        return Colors.purple;
      case 'auth':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _formatDate(String? dateString) {
    if (dateString == null) return 'N/A';
    
    try {
      final date = DateTime.parse(dateString);
      return '${date.day}/${date.month}/${date.year} ${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } catch (e) {
      return 'N/A';
    }
  }
}
