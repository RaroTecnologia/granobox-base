import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/category_models.dart';
import '../providers/categories_products_provider.dart';
import '../theme/app_theme.dart';

/// Widget personalizado para dropdown de categorias com hierarquia e identação
class HierarchicalCategoryDropdown extends StatelessWidget {
  final String? selectedCategoryId;
  final ValueChanged<String?> onChanged;
  final String? Function(String?)? validator;
  final String labelText;
  final bool isRequired;

  const HierarchicalCategoryDropdown({
    super.key,
    required this.selectedCategoryId,
    required this.onChanged,
    this.validator,
    this.labelText = 'Categoria',
    this.isRequired = true,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<CategoriesProductsProvider>(
      builder: (context, provider, child) {
        final categories = provider.categoriesForDropdown;
        
        // Verificar se o valor selecionado existe na lista
        final validSelectedId = (selectedCategoryId != null && 
            categories.any((c) => c.id == selectedCategoryId)) 
            ? selectedCategoryId 
            : null;
        
        // Pré-calcular níveis uma única vez (evita recalcular para cada item)
        final Map<String, int> levelCache = {};
        for (final cat in categories) {
          levelCache[cat.id] = _getCategoryLevelCached(cat, provider.categories, levelCache);
        }
        
        // Construir items com hierarquia
        final items = categories.map((category) {
          final level = levelCache[category.id] ?? 0;
          final prefix = level > 0 ? '${'  ' * level}↳ ' : '';
          
          return DropdownMenuItem<String>(
            value: category.id,
            child: Text(
              '$prefix${category.name}',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
          );
        }).toList();
        
        return DropdownButtonFormField<String>(
          value: validSelectedId,
          decoration: InputDecoration(
            labelText: isRequired ? '$labelText *' : labelText,
            labelStyle: TextStyle(color: AppTheme.dark300),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.dark600),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.dark600),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppTheme.primary, width: 2),
            ),
            filled: true,
            fillColor: AppTheme.dark700,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          dropdownColor: AppTheme.dark700,
          style: TextStyle(color: Colors.white),
          items: items,
          onChanged: onChanged,
          validator: validator,
        );
      },
    );
  }

  /// Calcular o nível de profundidade de uma categoria com cache
  int _getCategoryLevelCached(Category category, List<Category> allCategories, Map<String, int> cache) {
    if (category.parentId == null) return 0;
    
    // Verificar se já está no cache
    if (cache.containsKey(category.id)) {
      return cache[category.id]!;
    }
    
    // Buscar parent
    final parentIndex = allCategories.indexWhere((c) => c.id == category.parentId);
    if (parentIndex == -1) return 0; // Parent não encontrado
    
    final parent = allCategories[parentIndex];
    final parentLevel = _getCategoryLevelCached(parent, allCategories, cache);
    final level = parentLevel + 1;
    
    // Limitar profundidade máxima
    return level > 5 ? 5 : level;
  }
}
