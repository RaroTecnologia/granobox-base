import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';

/// Header padrão para telas de gerenciamento (Operadores, Usuários, etc.)
class ManagementScreenHeader extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final int itemCount;
  final String itemLabel; // Label para o contador (ex: "usuários", "operadores")
  final VoidCallback? onRefresh;

  const ManagementScreenHeader({
    super.key,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.itemCount,
    required this.itemLabel,
    this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        border: Border(
          bottom: BorderSide(
            color: AppTheme.dark700,
            width: 1,
          ),
        ),
      ),
      child: Row(
        children: [
          // Ícone
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppTheme.primary.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              icon,
              color: AppTheme.primary,
              size: 28,
            ),
          ),
          const SizedBox(width: 16),
          
          // Textos
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.dark300,
                  ),
                ),
                const SizedBox(height: 8),
                // Contador
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '$itemCount $itemLabel',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
              ],
            ),
          ),
          
          // Botão de refresh (se fornecido)
          if (onRefresh != null)
            IconButton(
              onPressed: onRefresh,
              icon: const Icon(PhosphorIcons.arrowClockwise),
              color: AppTheme.dark300,
              tooltip: 'Atualizar',
            ),
        ],
      ),
    );
  }
}

