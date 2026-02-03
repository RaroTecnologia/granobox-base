import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/operations_provider.dart';
import '../models/operation_models.dart';

/// Componente para selecionar uma operação
class OperationSelector extends StatelessWidget {
  final bool showLabel;
  final bool allowNull;
  final String? nullOptionText;
  final ValueChanged<Operation?>? onChanged;

  const OperationSelector({
    Key? key,
    this.showLabel = true,
    this.allowNull = true,
    this.nullOptionText = 'Todas as operações',
    this.onChanged,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<OperationsProvider>(
      builder: (context, operationsProvider, child) {
        final operations = operationsProvider.activeOperations;
        final selectedOperation = operationsProvider.selectedOperation;

        // Se não houver operações, não mostrar o seletor
        if (operations.isEmpty) {
          return const SizedBox.shrink();
        }

        // Se houver apenas uma operação, selecionar automaticamente
        if (operations.length == 1 && !allowNull) {
          WidgetsBinding.instance.addPostFrameCallback((_) {
            if (selectedOperation?.id != operations.first.id) {
              operationsProvider.selectOperation(operations.first);
            }
          });
        }

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (showLabel)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Text(
                  'Operação',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[700],
                  ),
                ),
              ),
            Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[300]!),
              ),
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<String?>(
                  isExpanded: true,
                  value: selectedOperation?.id,
                  hint: Text(
                    nullOptionText ?? 'Selecione uma operação',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  icon: Icon(Icons.arrow_drop_down, color: Colors.grey[700]),
                  items: [
                    if (allowNull)
                      DropdownMenuItem<String?>(
                        value: null,
                        child: Text(
                          nullOptionText ?? 'Todas as operações',
                          style: TextStyle(
                            color: Colors.grey[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ...operations.map((operation) {
                      return DropdownMenuItem<String?>(
                        value: operation.id,
                        child: Row(
                          children: [
                            Icon(
                              Icons.business_outlined,
                              size: 18,
                              color: Colors.blue[700],
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                operation.name,
                                style: TextStyle(
                                  color: Colors.grey[800],
                                  fontWeight: FontWeight.w500,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (operation.agentFingerprint != null)
                              Container(
                                margin: const EdgeInsets.only(left: 8),
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 6,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: Colors.green[100],
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(
                                      Icons.usb,
                                      size: 12,
                                      color: Colors.green[700],
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      'USB',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Colors.green[700],
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                          ],
                        ),
                      );
                    }).toList(),
                  ],
                  onChanged: (String? operationId) {
                    final operation = operationId == null
                        ? null
                        : operations.firstWhere((op) => op.id == operationId);
                    
                    operationsProvider.selectOperation(operation);
                    
                    if (onChanged != null) {
                      onChanged!(operation);
                    }
                  },
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

