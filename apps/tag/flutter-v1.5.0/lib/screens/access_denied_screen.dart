import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../providers/operators_provider.dart';
import '../providers/operator_session_provider.dart';
import '../models/operator_models.dart';

class AccessDeniedScreen extends StatelessWidget {
  final String requiredLevel; // 'intermediate' ou 'advanced'

  const AccessDeniedScreen({super.key, required this.requiredLevel});

  String _levelLabel(String level) {
    switch (level) {
      case 'advanced':
        return 'Avançado';
      case 'intermediate':
        return 'Intermediário';
      default:
        return 'Básico';
    }
  }

  // Formatar o nome do nível de acesso do operador
  String _formatarNivel(String? role) {
    if (role == null || role.trim().isEmpty) {
      return 'Básico';
    }
    
    final roleLower = role.trim().toLowerCase();
    switch (roleLower) {
      case 'basic':
        return 'Básico';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return roleLower[0].toUpperCase() + roleLower.substring(1);
    }
  }

  String _levelDescription(String level) {
    switch (level) {
      case 'advanced':
        return 'Acesso completo, incluindo configurações.';
      case 'intermediate':
        return 'Criar etiquetas e cadastrar produtos.';
      default:
        return 'Criar etiquetas.';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppTheme.dark900,
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 36.0).copyWith(top: 16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                constraints: const BoxConstraints(maxWidth: 420),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: AppTheme.dark800,
                  border: Border.all(color: AppTheme.dark700),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Icon(
                      PhosphorIcons.shieldSlash,
                      color: Colors.white,
                      size: 40,
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      'Acesso negado',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Você não tem permissão para acessar esta seção.',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.dark600),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                PhosphorIcons.info,
                                color: AppTheme.primary,
                                size: 16,
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'Permissão necessária: ${_levelLabel(requiredLevel)}',
                                style: TextStyle(
                                  color: AppTheme.primary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w600,
                                ),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            _levelDescription(requiredLevel),
                            style: TextStyle(
                              color: AppTheme.dark300,
                              fontSize: 12,
                            ),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => _showOperatorPinDialog(context),
                        icon: const Icon(PhosphorIcons.key, size: 18),
                        label: const Text('Inserir PIN de Operador'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showOperatorPinDialog(BuildContext context) {
    final operatorsProvider = context.read<OperatorsProvider>();
    final operatorsWithPin = operatorsProvider.operatorsWithPin;

    if (operatorsWithPin.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Nenhum operador com PIN configurado'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    // Mostrar modal de seleção de operador
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text(
          'Selecione o Operador',
          style: TextStyle(color: Colors.white),
        ),
        content: SizedBox(
          width: 300,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: operatorsWithPin.map((operator) {
              return ListTile(
                leading: Icon(
                  PhosphorIcons.user,
                  color: AppTheme.primary,
                ),
                title: Text(
                  operator.name,
                  style: const TextStyle(color: Colors.white),
                ),
                subtitle: Text(
                  _formatarNivel(operator.role),
                  style: TextStyle(color: AppTheme.dark300, fontSize: 12),
                ),
                onTap: () {
                  Navigator.pop(context);
                  _showPinInputDialog(context, operator);
                },
              );
            }).toList(),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'Cancelar',
              style: TextStyle(color: AppTheme.dark300),
            ),
          ),
        ],
      ),
    );
  }

  void _showPinInputDialog(BuildContext context, Operator operator) {
    final pinController = TextEditingController();
    bool pinInvalido = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: AppTheme.dark800,
          title: Text(
            'PIN de ${operator.name}',
            style: const TextStyle(color: Colors.white),
          ),
          content: SizedBox(
            width: 300,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Digite o PIN de 4 dígitos:',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: pinController,
                  decoration: InputDecoration(
                    labelText: 'PIN',
                    labelStyle: TextStyle(
                      color: pinInvalido ? Colors.red : AppTheme.dark300,
                    ),
                    border: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: pinInvalido ? Colors.red : AppTheme.dark600,
                      ),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: pinInvalido ? Colors.red : AppTheme.dark600,
                      ),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: pinInvalido ? Colors.red : AppTheme.primary,
                      ),
                    ),
                    hintText: '0000',
                    errorText: pinInvalido ? 'PIN incorreto' : null,
                  ),
                  style: const TextStyle(color: Colors.white),
                  keyboardType: TextInputType.number,
                  maxLength: 4,
                  obscureText: true,
                  textAlign: TextAlign.center,
                  onChanged: (value) {
                    if (pinInvalido) {
                      setState(() {
                        pinInvalido = false;
                      });
                    }
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancelar',
                style: TextStyle(color: AppTheme.dark300),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                final pinDigitado = pinController.text;
                if (pinDigitado == operator.pin) {
                  // Atualizar sessão do operador
                  context.read<OperatorSessionProvider>().setCurrentOperator(operator);
                  
                  Navigator.pop(context); // Fecha modal do PIN
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Acesso liberado para ${operator.name}'),
                      backgroundColor: Colors.green,
                      duration: Duration(seconds: 2),
                    ),
                  );
                  
                  // O Consumer<OperatorSessionProvider> na tela pai vai detectar
                  // a mudança automaticamente e mostrar a tela correta
                } else {
                  setState(() {
                    pinInvalido = true;
                  });
                  pinController.clear();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
              child: const Text('Confirmar'),
            ),
          ],
        ),
      ),
    );
  }
}


