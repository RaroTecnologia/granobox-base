import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/date_config_provider.dart';
import '../providers/auth_provider.dart';

class DateConfigWidget extends StatefulWidget {
  const DateConfigWidget({Key? key}) : super(key: key);

  @override
  State<DateConfigWidget> createState() => _DateConfigWidgetState();
}

class _DateConfigWidgetState extends State<DateConfigWidget> {
  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    print('🔧 DateConfigWidget - Iniciando carregamento da configuração...');
    final authProvider = context.read<AuthProvider>();
    final dateConfigProvider = context.read<DateConfigProvider>();
    
    final token = await authProvider.authToken;
    print('🔑 Token obtido: ${token != null ? "SIM" : "NÃO"}');
    
    if (token != null) {
      print('🔧 Chamando loadDateConfig...');
      await dateConfigProvider.loadDateConfig(token);
      print('🔧 loadDateConfig concluído');
    } else {
      print('❌ Token não encontrado');
    }
  }

  Future<void> _toggleShowTime(bool value) async {
    final authProvider = context.read<AuthProvider>();
    final dateConfigProvider = context.read<DateConfigProvider>();
    
    final token = await authProvider.authToken;
    if (token != null) {
      final success = await dateConfigProvider.updateShowTimeToggle(token, value);
      
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              value 
                ? '✅ Hora das datas ativada' 
                : '✅ Hora das datas desativada'
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: ${dateConfigProvider.error ?? 'Erro desconhecido'}'),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DateConfigProvider>(
      builder: (context, dateConfigProvider, child) {
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
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      PhosphorIcons.calendar,
                      color: AppTheme.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Configurações de Datas',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'Configure como as datas são exibidas nas etiquetas',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppTheme.dark300,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 24),

              // Toggle para exibir hora
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.dark700,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    Icon(
                      PhosphorIcons.clock,
                      color: AppTheme.primary,
                      size: 20,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Exibir Hora nas Datas',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            dateConfigProvider.showTimeInDates
                                ? 'Datas serão exibidas com hora (ex: 25/12/2024 14:30)'
                                : 'Datas serão exibidas sem hora (ex: 25/12/2024)',
                            style: TextStyle(
                              fontSize: 12,
                              color: AppTheme.dark300,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: dateConfigProvider.showTimeInDates,
                      onChanged: dateConfigProvider.isLoading ? null : _toggleShowTime,
                      activeColor: AppTheme.primary,
                      inactiveThumbColor: AppTheme.dark300,
                      inactiveTrackColor: AppTheme.dark600,
                    ),
                  ],
                ),
              ),

              // (Removido) indicador de formato atual

              // Loading indicator
              if (dateConfigProvider.isLoading) ...[
                const SizedBox(height: 16),
                const Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppTheme.primary),
                  ),
                ),
              ],

              // Error message
              if (dateConfigProvider.error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.red.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: Colors.red.withOpacity(0.3),
                      width: 1,
                    ),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        PhosphorIcons.warning,
                        color: Colors.red,
                        size: 16,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          dateConfigProvider.error!,
                          style: const TextStyle(
                            color: Colors.red,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
