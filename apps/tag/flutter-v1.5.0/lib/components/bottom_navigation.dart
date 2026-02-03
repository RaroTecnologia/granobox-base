import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'custom_icon.dart';

class BottomNavigation extends StatelessWidget {
  final int currentIndex;
  final Function(int) onTap;

  const BottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppTheme.dark900,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.15),
            blurRadius: 10,
            offset: const Offset(0, -2),
            spreadRadius: 0,
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Container(
          height: 73,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(
                iconPath: 'assets/icons/printer.svg',
                label: 'Etiquetas',
                index: 0,
                isSelected: currentIndex == 0,
              ),
              _buildNavItem(
                iconPath: 'assets/icons/alertas.svg',
                label: 'Alertas',
                index: 1,
                isSelected: currentIndex == 1,
              ),
              _buildNavItem(
                iconPath: 'assets/icons/tag.svg', // Ícone temporário - pode ser substituído por ícone de árvore
                label: 'Rastreab.',
                index: 2,
                isSelected: currentIndex == 2,
              ),
              _buildNavItem(
                iconPath: 'assets/icons/cadastro.svg',
                label: 'Cadastros',
                index: 3,
                isSelected: currentIndex == 3,
              ),
              _buildNavItem(
                iconPath: 'assets/icons/ajustes.svg',
                label: 'Ajustes',
                index: 4,
                isSelected: currentIndex == 4,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required String iconPath,
    required String label,
    required int index,
    required bool isSelected,
  }) {
    return GestureDetector(
      onTap: () => onTap(index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Ícone SVG personalizado
            CustomIcon(
              iconPath: iconPath,
              size: 30,
              color: isSelected ? AppTheme.primary : AppTheme.dark300,
            ),
            const SizedBox(height: 3),
            // Label
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: isSelected ? AppTheme.primary : AppTheme.dark300,
                fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
            // Indicador de seleção (linha inferior)
            if (isSelected)
              Container(
                margin: const EdgeInsets.only(top: 3),
                width: 16,
                height: 2,
                decoration: BoxDecoration(
                  color: AppTheme.primary,
                  borderRadius: BorderRadius.circular(1),
                ),
              ),
          ],
        ),
      ),
    );
  }
}