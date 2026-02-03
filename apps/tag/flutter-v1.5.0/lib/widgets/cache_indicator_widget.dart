import 'package:flutter/material.dart';
import '../services/smart_cache_service.dart';

/// Widget que mostra informações sobre o cache
class CacheIndicatorWidget extends StatefulWidget {
  final String cacheKey;
  final String cacheType;
  final Widget child;
  final bool showRefreshButton;
  final VoidCallback? onRefresh;

  const CacheIndicatorWidget({
    Key? key,
    required this.cacheKey,
    required this.cacheType,
    required this.child,
    this.showRefreshButton = true,
    this.onRefresh,
  }) : super(key: key);

  @override
  State<CacheIndicatorWidget> createState() => _CacheIndicatorWidgetState();
}

class _CacheIndicatorWidgetState extends State<CacheIndicatorWidget> {
  int? _cacheAge;
  bool _isValid = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _updateCacheInfo();
  }

  Future<void> _updateCacheInfo() async {
    if (!mounted) return;
    
    setState(() => _isLoading = true);
    
    try {
      final age = await SmartCacheService.getCacheAge(widget.cacheKey);
      final isValid = await SmartCacheService.isCacheValid(
        key: widget.cacheKey,
        type: widget.cacheType,
      );
      
      if (mounted) {
        setState(() {
          _cacheAge = age;
          _isValid = isValid;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  String _formatAge(int? age) {
    if (age == null) return 'Desconhecido';
    
    if (age < 1) return 'Agora mesmo';
    if (age < 60) return '${age}min atrás';
    
    final hours = age ~/ 60;
    if (hours < 24) return '${hours}h atrás';
    
    final days = hours ~/ 24;
    return '${days}d atrás';
  }

  Color _getAgeColor(int? age) {
    if (age == null) return Colors.grey;
    
    if (age < 5) return Colors.green;
    if (age < 30) return Colors.orange;
    return Colors.red;
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}

/// Widget de pull-to-refresh personalizado
class SmartRefreshWidget extends StatelessWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final String? refreshMessage;

  const SmartRefreshWidget({
    Key? key,
    required this.child,
    required this.onRefresh,
    this.refreshMessage,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: child,
      backgroundColor: Colors.white,
      color: Theme.of(context).primaryColor,
      strokeWidth: 2.5,
      displacement: 40,
    );
  }
}

/// Widget de status de conectividade com cache
class ConnectivityCacheStatus extends StatefulWidget {
  final Widget child;
  final VoidCallback? onOnline;
  final VoidCallback? onOffline;

  const ConnectivityCacheStatus({
    Key? key,
    required this.child,
    this.onOnline,
    this.onOffline,
  }) : super(key: key);

  @override
  State<ConnectivityCacheStatus> createState() => _ConnectivityCacheStatusState();
}

class _ConnectivityCacheStatusState extends State<ConnectivityCacheStatus> {
  bool _isOnline = true;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    // Simular verificação de conectividade
    // Em uma implementação real, você usaria o ConnectivityService
    await Future.delayed(const Duration(seconds: 1));
    
    if (mounted) {
      setState(() {
        _isOnline = true; // Simular online
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
      );
    }

    return Column(
      children: [
        if (!_isOnline)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            color: Colors.orange[100],
            child: Row(
              children: [
                Icon(Icons.wifi_off, color: Colors.orange[800]),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Modo offline - Dados do cache',
                    style: TextStyle(
                      color: Colors.orange[800],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        Expanded(child: widget.child),
      ],
    );
  }
}
