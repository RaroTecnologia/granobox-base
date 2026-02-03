import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import '../providers/operators_provider.dart';
import '../models/operator_models.dart';
import '../providers/operator_session_provider.dart';
import '../widgets/management_screen_header.dart';

class OperatorsManagementScreen extends StatefulWidget {
  const OperatorsManagementScreen({super.key});

  @override
  State<OperatorsManagementScreen> createState() =>
      _OperatorsManagementScreenState();
}

class _OperatorsManagementScreenState extends State<OperatorsManagementScreen> {
  @override
  void initState() {
    super.initState();
    // Carregar operadores ao entrar
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final opsProvider = context.read<OperatorsProvider>();
      await opsProvider.loadOperators(forceRefresh: true);
      if (!mounted) return;
      try {
        final sessionProvider = context.read<OperatorSessionProvider>();
        sessionProvider.refreshFromOperators(opsProvider.operators);
      } catch (_) {}
    });
  }

  // Formatar o nome do nível de acesso
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

  void _confirmarMudarStatus(Operator operator) {
    final acao = operator.isActive ? 'desativar' : 'ativar';
    final acaoCapital = operator.isActive ? 'Desativar' : 'Ativar';
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        title: Text(
          '$acaoCapital Operador',
          style: const TextStyle(color: Colors.white),
        ),
        content: Text(
          operator.isActive
              ? 'Tem certeza que deseja desativar o operador "${operator.name}"?\n\nEle não poderá mais acessar o sistema.'
              : 'Tem certeza que deseja ativar o operador "${operator.name}"?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(
              'Cancelar',
              style: TextStyle(color: AppTheme.dark300),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await _mudarStatusOperador(operator);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: operator.isActive ? Colors.red : AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            child: Text(acaoCapital),
          ),
        ],
      ),
    );
  }

  Future<void> _mudarStatusOperador(Operator operator) async {
    final messenger = ScaffoldMessenger.of(context);
    final ops = context.read<OperatorsProvider>();
    
    try {
      final updated = await ops.updateOperator(
        operator.id,
        UpdateOperatorRequest(isActive: !operator.isActive),
      );
      
      if (updated != null) {
        // Atualizar sessão se for o operador logado
        try {
          final sessionProvider = context.read<OperatorSessionProvider>();
          if (sessionProvider.currentOperator?.id == updated.id) {
            sessionProvider.setCurrentOperator(updated);
          }
        } catch (_) {}
        
        messenger.showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(
                  PhosphorIcons.checkCircle,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    operator.isActive
                        ? 'Operador desativado com sucesso'
                        : 'Operador ativado com sucesso',
                  ),
                ),
              ],
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      } else {
        messenger.showSnackBar(
          SnackBar(
            content: Row(
              children: [
                Icon(
                  PhosphorIcons.xCircle,
                  color: Colors.white,
                  size: 20,
                ),
                const SizedBox(width: 8),
                const Expanded(
                  child: Text('Erro ao atualizar status do operador'),
                ),
              ],
            ),
            backgroundColor: Colors.red,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    } catch (e) {
      messenger.showSnackBar(
        SnackBar(
          content: Text('Erro: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _openEditOperator(Operator? operator) {
    final formKey = GlobalKey<FormState>();
    final nameController = TextEditingController(text: operator?.name ?? '');
    final pinController = TextEditingController(text: operator?.pin ?? '');
    bool isActive = operator?.isActive ?? true;
    String role = (operator?.role ?? 'basic').toLowerCase();

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          backgroundColor: AppTheme.dark800,
          title: Text(
            operator == null ? 'Novo Operador' : 'Editar Operador',
            style: const TextStyle(color: Colors.white),
          ),
          content: SizedBox(
            width: 400,
            child: Form(
              key: formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextFormField(
                    controller: nameController,
                    decoration: InputDecoration(
                      labelText: 'Nome',
                      labelStyle: TextStyle(color: AppTheme.dark300),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppTheme.dark600),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppTheme.primary),
                      ),
                    ),
                    style: const TextStyle(color: Colors.white),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Informe o nome do operador';
                      }
                      if (value.trim().length < 3) {
                        return 'Nome muito curto';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    initialValue: role,
                    items: const [
                      DropdownMenuItem(
                        value: 'basic',
                        child: Text('Nível: Básico'),
                      ),
                      DropdownMenuItem(
                        value: 'intermediate',
                        child: Text('Nível: Intermediário'),
                      ),
                      DropdownMenuItem(
                        value: 'advanced',
                        child: Text('Nível: Avançado'),
                      ),
                    ],
                    onChanged: (v) => setState(() => role = v ?? 'basic'),
                    decoration: InputDecoration(
                      labelText: 'Nível de Acesso',
                      labelStyle: TextStyle(color: AppTheme.dark300),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppTheme.dark600),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppTheme.primary),
                      ),
                    ),
                    dropdownColor: AppTheme.dark800,
                    style: const TextStyle(color: Colors.white),
                  ),
                  const SizedBox(height: 12),
                  TextFormField(
                    controller: pinController,
                    decoration: InputDecoration(
                      labelText: 'PIN (4 dígitos)',
                      labelStyle: TextStyle(color: AppTheme.dark300),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppTheme.dark600),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(color: AppTheme.primary),
                      ),
                    ),
                    style: const TextStyle(color: Colors.white),
                    keyboardType: TextInputType.number,
                    maxLength: 4,
                    obscureText: true,
                    validator: (value) {
                      if (operator == null ||
                          (value != null && value.trim().isNotEmpty)) {
                        final pin = value?.trim() ?? '';
                        if (pin.length != 4) {
                          return 'Informe um PIN com 4 dígitos';
                        }
                        if (!RegExp(r'^\d{4}$').hasMatch(pin)) {
                          return 'Use apenas números';
                        }
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),
                  SwitchListTile(
                    value: isActive,
                    onChanged: (v) => setState(() => isActive = v),
                    title: const Text(
                      'Ativo',
                      style: TextStyle(color: Colors.white),
                    ),
                    thumbColor: WidgetStateProperty.resolveWith<Color?>(
                      (states) => states.contains(WidgetState.selected)
                          ? AppTheme.primary
                          : null,
                    ),
                    trackColor: WidgetStateProperty.resolveWith<Color?>(
                      (states) => states.contains(WidgetState.selected)
                          ? AppTheme.primary.withValues(alpha: 0.4)
                          : null,
                    ),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                'Cancelar',
                style: TextStyle(color: Colors.white),
              ),
            ),
            ElevatedButton(
              onPressed: () async {
                final messenger = ScaffoldMessenger.of(context);
                final navigator = Navigator.of(context);
                final ops = context.read<OperatorsProvider>();
                OperatorSessionProvider? sessionProvider;
                try {
                  sessionProvider = context.read<OperatorSessionProvider>();
                } catch (_) {
                  sessionProvider = null;
                }

                if (!formKey.currentState!.validate()) {
                  return;
                }
                final pinValue = pinController.text.trim();
                if (operator == null && pinValue.isEmpty) {
                  messenger.showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Defina um PIN de 4 dígitos para o novo operador',
                      ),
                      backgroundColor: Colors.red,
                    ),
                  );
                  return;
                }

                if (operator == null) {
                  final created = await ops.createOperator(
                    CreateOperatorRequest(
                      name: nameController.text.trim(),
                      pin: pinValue,
                      role: role,
                      isActive: isActive,
                    ),
                  );
                  if (created == null) {
                    if (!mounted) return;
                    messenger.showSnackBar(
                      const SnackBar(
                        content: Text(
                          'Não foi possível criar o operador. Verifique os dados e tente novamente.',
                        ),
                        backgroundColor: Colors.red,
                      ),
                    );
                    return;
                  }
                } else {
                  final updated = await ops.updateOperator(
                    operator.id,
                    UpdateOperatorRequest(
                      name: nameController.text.trim(),
                      pin: pinValue.isEmpty ? null : pinValue,
                      role: role,
                      isActive: isActive,
                    ),
                  );
                  if (updated != null && sessionProvider != null) {
                    if (sessionProvider.currentOperator?.id == updated.id) {
                      sessionProvider.setCurrentOperator(updated);
                    }
                  }
                }
                if (!mounted) return;
                navigator.pop();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
              child: const Text('Salvar'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark800,
        foregroundColor: Colors.white,
        elevation: 0,
        title: const Text('Gerenciar Operadores'),
      ),
      body: Consumer<OperatorsProvider>(
        builder: (context, ops, _) {
          final list = ops.operators;
          return Column(
            children: [
              ManagementScreenHeader(
                title: 'Operadores',
                subtitle: 'Gerencie os operadores com acesso ao sistema',
                icon: PhosphorIcons.users,
                itemCount: list.length,
                itemLabel: list.length == 1 ? 'operador' : 'operadores',
                onRefresh: () => ops.loadOperators(forceRefresh: true),
              ),
              Expanded(child: _buildBody(ops, list)),
            ],
          );
        },
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEditOperator(null),
        backgroundColor: AppTheme.primary,
        icon: const Icon(PhosphorIcons.userPlus, color: Colors.white),
        label: const Text(
          'Novo Operador',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }

  Widget _buildBody(OperatorsProvider ops, List<Operator> list) {
    if (ops.isLoading && list.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    if (ops.error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(PhosphorIcons.warning, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            const Text(
              'Erro ao carregar operadores',
              style: TextStyle(fontSize: 18, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              ops.error!,
              style: TextStyle(fontSize: 14, color: AppTheme.dark300),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: () => ops.loadOperators(forceRefresh: true),
              icon: const Icon(PhosphorIcons.arrowClockwise),
              label: const Text('Tentar Novamente'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
              ),
            ),
          ],
        ),
      );
    }

    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(PhosphorIcons.users, size: 64, color: AppTheme.dark600),
            const SizedBox(height: 16),
            const Text(
              'Nenhum operador cadastrado',
              style: TextStyle(fontSize: 18, color: Colors.white),
            ),
            const SizedBox(height: 8),
            Text(
              'Adicione operadores para gerenciar o acesso',
              style: TextStyle(fontSize: 14, color: AppTheme.dark300),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final op = list[index];
        return Opacity(
          opacity: op.isActive ? 1.0 : 0.6,
          child: Container(
            decoration: BoxDecoration(
              color: AppTheme.dark800,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(
                color: op.isActive ? AppTheme.dark700 : AppTheme.dark600,
              ),
            ),
            child: ListTile(
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              leading: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: op.isActive 
                      ? AppTheme.primary.withOpacity(0.2)
                      : AppTheme.dark700,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  op.isActive ? PhosphorIcons.user : PhosphorIcons.userCircleMinus,
                  color: op.isActive ? AppTheme.primary : AppTheme.dark400,
                  size: 24,
                ),
              ),
              title: Row(
                children: [
                  Expanded(
                    child: Text(
                      op.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (!op.isActive)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.red.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(color: Colors.red.withOpacity(0.3)),
                      ),
                      child: const Text(
                        'INATIVO',
                        style: TextStyle(
                          color: Colors.red,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                ],
              ),
              subtitle: Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Row(
                  children: [
                    Icon(
                      PhosphorIcons.shieldStar,
                      color: AppTheme.dark400,
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      _formatarNivel(op.role),
                      style: TextStyle(color: AppTheme.dark400, fontSize: 13),
                    ),
                  ],
                ),
              ),
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    onPressed: () => _openEditOperator(op),
                    icon: const Icon(
                      PhosphorIcons.pencilSimple,
                      color: Colors.white,
                    ),
                    tooltip: 'Editar',
                  ),
                  const SizedBox(width: 4),
                  IconButton(
                    onPressed: () => _confirmarMudarStatus(op),
                    icon: Icon(
                      op.isActive ? PhosphorIcons.toggleRight : PhosphorIcons.toggleLeft,
                      color: op.isActive ? AppTheme.primary : AppTheme.dark400,
                      size: 32,
                    ),
                    tooltip: op.isActive ? 'Desativar' : 'Ativar',
                  ),
                ],
              ),
            ),
          ),
        );
      },
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemCount: list.length,
    );
  }
}
