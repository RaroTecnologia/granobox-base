import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import 'header_button.dart';
import 'custom_icon.dart';

class StandardHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool showBack;
  final bool showSearch;
  final bool showHome;
  final bool showLeading;
  final VoidCallback? onBack;
  final VoidCallback? onSearch;
  final VoidCallback? onHome;
  final EdgeInsets? padding;
  final Color backgroundColor;
  final Color iconColor;
  final IconData? leadingIcon;
  final String? leadingIconPath;

  const StandardHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.showBack = true,
    this.showSearch = true,
    this.showHome = true,
    this.showLeading = true,
    this.onBack,
    this.onSearch,
    this.onHome,
    this.padding,
    this.backgroundColor = AppTheme.dark800,
    this.iconColor = AppTheme.primary,
    this.leadingIcon,
    this.leadingIconPath,
  });

  @override
  Widget build(BuildContext context) {
    final EdgeInsets resolvedPadding = padding ?? const EdgeInsets.symmetric(horizontal: 20.0, vertical: 12.0);

    return Container(
      width: double.infinity,
      color: backgroundColor,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: resolvedPadding,
          child: Row(
            children: [
              if (showBack)
                HeaderButton(
                  iconPath: 'assets/icons/voltar.svg',
                  onTap: onBack ?? () => Navigator.pop(context),
                  size: 32,
                  color: iconColor,
                  tooltip: 'Voltar',
                ),
              if (showBack) const SizedBox(width: 16),

              if (!showBack && showLeading && (leadingIcon != null || leadingIconPath != null))
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: iconColor.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Center(
                    child: leadingIconPath != null
                        ? CustomIcon(iconPath: leadingIconPath!, size: 20, color: iconColor)
                        : Icon(leadingIcon, size: 20, color: iconColor),
                  ),
                ),
              if (!showBack && showLeading && (leadingIcon != null || leadingIconPath != null)) const SizedBox(width: 10),

              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (subtitle != null && subtitle!.isNotEmpty)
                      Text(
                        subtitle!,
                        style: TextStyle(
                          fontSize: 12,
                          color: AppTheme.dark400,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                  ],
                ),
              ),

              // Ações
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (showSearch)
                    HeaderButton(
                      icon: PhosphorIcons.magnifyingGlass,
                      onTap: onSearch ?? () {},
                      size: 32,
                      color: iconColor,
                      tooltip: 'Buscar',
                    ),
                  if (showSearch && showHome) const SizedBox(width: 8),
                  if (showHome)
                    HeaderButton(
                      icon: PhosphorIcons.house,
                      onTap: onHome ?? () {},
                      size: 32,
                      color: iconColor,
                      tooltip: 'Home',
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}


