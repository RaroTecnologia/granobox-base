import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import '../models/storage_location_models.dart';

class StorageLocationSelector extends StatelessWidget {
  final String? selectedLocationId;
  final List<StorageLocation> locations;
  final Function(String?) onChanged;
  final String label;
  final bool isRequired;
  final bool enabled;

  const StorageLocationSelector({
    super.key,
    required this.selectedLocationId,
    required this.locations,
    required this.onChanged,
    this.label = 'Local de Armazenamento',
    this.isRequired = false,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    final selectedLocation = locations
        .where((loc) => loc.id == selectedLocationId)
        .firstOrNull;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label + (isRequired ? ' *' : ''),
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: enabled ? () => _showLocationPicker(context) : null,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            decoration: BoxDecoration(
              color: enabled ? AppTheme.dark700 : AppTheme.dark800,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppTheme.dark600,
                width: 1,
              ),
            ),
            child: Row(
              children: [
                Icon(
                  PhosphorIcons.mapPin,
                  color: enabled ? AppTheme.primary : AppTheme.dark400,
                  size: 20,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    selectedLocation?.displayName ?? 'Selecionar local',
                    style: TextStyle(
                      color: selectedLocation != null 
                          ? Colors.white 
                          : AppTheme.dark400,
                      fontSize: 16,
                    ),
                  ),
                ),
                Icon(
                  PhosphorIcons.caretDown,
                  color: enabled ? AppTheme.dark300 : AppTheme.dark400,
                  size: 16,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  void _showLocationPicker(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Container(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Icon(
                  PhosphorIcons.mapPin,
                  color: AppTheme.primary,
                  size: 24,
                ),
                const SizedBox(width: 12),
                Text(
                  'Selecionar Local de Armazenamento',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            
            // Lista de locais
            if (locations.isEmpty)
              Center(
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(
                    children: [
                      Icon(
                        PhosphorIcons.mapPin,
                        color: AppTheme.dark300,
                        size: 48,
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Nenhum local cadastrado',
                        style: TextStyle(
                          color: AppTheme.dark300,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Acesse a aba "Locais" para cadastrar',
                        style: TextStyle(
                          color: AppTheme.dark400,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                itemCount: locations.length + 1, // +1 para a opção "Nenhum"
                itemBuilder: (context, index) {
                  if (index == 0) {
                    // Opção "Nenhum"
                    final isSelected = selectedLocationId == null;
                    return _buildLocationTile(
                      context: context,
                      title: 'Nenhum local',
                      subtitle: 'Não definir local padrão',
                      isSelected: isSelected,
                      onTap: () {
                        onChanged(null);
                        Navigator.pop(context);
                      },
                    );
                  }
                  
                  final location = locations[index - 1];
                  final isSelected = selectedLocationId == location.id;
                  
                  return _buildLocationTile(
                    context: context,
                    title: location.nome,
                    subtitle: '${location.tipo.displayName}${location.setor != null ? ' • ${location.setor}' : ''}',
                    isSelected: isSelected,
                    onTap: () {
                      onChanged(location.id);
                      Navigator.pop(context);
                    },
                  );
                },
              ),
            
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationTile({
    required BuildContext context,
    required String title,
    required String subtitle,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected 
              ? AppTheme.primary.withOpacity(0.1)
              : AppTheme.dark700,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected 
                ? AppTheme.primary
                : AppTheme.dark600,
            width: 1,
          ),
        ),
        child: Row(
          children: [
            Icon(
              PhosphorIcons.mapPin,
              color: isSelected 
                  ? AppTheme.primary
                  : AppTheme.dark300,
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      color: isSelected 
                          ? AppTheme.primary
                          : Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (subtitle.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            if (isSelected)
              Icon(
                PhosphorIcons.check,
                color: AppTheme.primary,
                size: 20,
              ),
          ],
        ),
      ),
    );
  }
}
