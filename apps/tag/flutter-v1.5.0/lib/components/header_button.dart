import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import 'custom_icon.dart';

class HeaderButton extends StatelessWidget {
  final IconData? icon;
  final String? iconPath;
  final VoidCallback onTap;
  final Color? color;
  final double? size;
  final String? tooltip;

  const HeaderButton({
    super.key,
    this.icon,
    this.iconPath,
    required this.onTap,
    this.color,
    this.size,
    this.tooltip,
  }) : assert(icon != null || iconPath != null, 'Either icon or iconPath must be provided');

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip ?? '',
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          splashColor: AppTheme.primary.withOpacity(0.1),
          highlightColor: AppTheme.primary.withOpacity(0.05),
          child: Container(
            padding: const EdgeInsets.all(8), // Área de toque reduzida para ícones mais próximos
            child: iconPath != null
                ? CustomIcon(
                    iconPath: iconPath!,
                    size: size ?? 32, // Tamanho maior por padrão
                    color: color ?? AppTheme.primary,
                  )
                : (icon == PhosphorIcons.house
                    ? CustomIcon(
                        iconPath: 'assets/icons/controle.svg',
                        size: size ?? 32,
                        color: color ?? AppTheme.primary,
                      )
                    : Icon(
                        icon!,
                        size: size ?? 32, // Tamanho maior por padrão
                        color: color ?? AppTheme.primary,
                      )),
          ),
        ),
      ),
    );
  }
}
