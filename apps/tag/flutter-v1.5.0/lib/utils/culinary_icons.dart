import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

/// Lista de ícones culinários disponíveis para categorias
/// Suporta tanto ícones PhosphorIcons quanto SVGs customizados
class CulinaryIcons {
  static final List<CulinaryIcon> icons = [
    // Bebidas
    CulinaryIcon(name: 'wine', icon: PhosphorIcons.wine, label: 'Bebidas'),
    CulinaryIcon(name: 'coffee', icon: PhosphorIcons.coffee, label: 'Café'),
    // Comidas
    CulinaryIcon(name: 'hamburger', icon: PhosphorIcons.hamburger, label: 'Hambúrguer'),
    CulinaryIcon(name: 'pizza', icon: PhosphorIcons.pizza, label: 'Pizza'),
    CulinaryIcon(name: 'cake', icon: PhosphorIcons.cake, label: 'Doces'),
    CulinaryIcon(name: 'fish', icon: PhosphorIcons.fish, label: 'Peixes'),
    CulinaryIcon(name: 'egg', icon: PhosphorIcons.egg, label: 'Ovos'),
    CulinaryIcon(name: 'cookie', icon: PhosphorIcons.cookie, label: 'Biscoitos'),
    CulinaryIcon(name: 'paes', icon: null, svgPath: 'assets/icons/culinary/paes.svg', label: 'Pães'),
    // Utensílios e Cozinha
    CulinaryIcon(name: 'forkKnife', icon: PhosphorIcons.forkKnife, label: 'Refeições'),
    CulinaryIcon(name: 'tray', icon: PhosphorIcons.tray, label: 'Bandejas'),
    CulinaryIcon(name: 'cookingPot', icon: PhosphorIcons.cookingPot, label: 'Panelas'),
    CulinaryIcon(name: 'knife', icon: PhosphorIcons.knife, label: 'Faca'),
    // Embalagens e Armazenamento
    CulinaryIcon(name: 'package', icon: PhosphorIcons.package, label: 'Embalados'),
    // Ícones alternativos genéricos (usando ícones que existem)
    CulinaryIcon(name: 'leaf', icon: PhosphorIcons.leaf, label: 'Vegetais'),
  ];

  /// Obter ícone por nome (retorna null se for SVG)
  static IconData? getIconByName(String? iconName) {
    if (iconName == null) return null;
    try {
      final icon = icons.firstWhere((item) => item.name == iconName);
      return icon.icon;
    } catch (e) {
      return null;
    }
  }

  /// Obter caminho do SVG por nome (retorna null se for ícone)
  static String? getSvgPathByName(String? iconName) {
    if (iconName == null) return null;
    try {
      final icon = icons.firstWhere((item) => item.name == iconName);
      return icon.svgPath;
    } catch (e) {
      return null;
    }
  }

  /// Verificar se é SVG
  static bool isSvg(String? iconName) {
    if (iconName == null) return false;
    try {
      final icon = icons.firstWhere((item) => item.name == iconName);
      return icon.svgPath != null;
    } catch (e) {
      return false;
    }
  }

  /// Obter label por nome
  static String? getLabelByName(String? iconName) {
    if (iconName == null) return null;
    try {
      return icons.firstWhere((item) => item.name == iconName).label;
    } catch (e) {
      return null;
    }
  }
}

class CulinaryIcon {
  final String name;
  final IconData? icon; // null se for SVG
  final String? svgPath; // null se for ícone
  final String label;

  CulinaryIcon({
    required this.name,
    this.icon,
    this.svgPath,
    required this.label,
  }) : assert(icon != null || svgPath != null, 'Either icon or svgPath must be provided');
}
