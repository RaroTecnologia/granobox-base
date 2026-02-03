import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';

class ThemeToggle extends StatelessWidget {
  final VoidCallback? onToggle;
  final bool isDark;

  const ThemeToggle({
    super.key,
    this.onToggle,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onToggle,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: AppTheme.primary,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: AppTheme.primary.withOpacity(0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Icon(
          isDark ? PhosphorIcons.sun : PhosphorIcons.moon,
          color: Colors.white,
          size: 24,
        ),
      ),
    );
  }
}
