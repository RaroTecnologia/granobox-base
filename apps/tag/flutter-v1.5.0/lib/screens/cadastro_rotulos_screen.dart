import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../components/header_button.dart';
import '../providers/label_templates_provider.dart';
import '../providers/auth_provider.dart';
import '../models/label_template_models.dart';
import '../services/label_templates_service.dart';

class CadastroRotulosScreen extends StatefulWidget {
  const CadastroRotulosScreen({super.key});

  @override
  State<CadastroRotulosScreen> createState() => _CadastroRotulosScreenState();
}

class _CadastroRotulosScreenState extends State<CadastroRotulosScreen> {
  @override
  void initState() {
    super.initState();
    _carregarRotulos();
  }

  Future<void> _carregarRotulos() async {
    final auth = context.read<AuthProvider>();
    final templatesProvider = context.read<LabelTemplatesProvider>();
    
    final clientId = auth.user?.clientId;
    final token = await auth.authToken;

    if (clientId != null) {
      await templatesProvider.carregarRotulos(
        clientId: clientId,
        authToken: token,
        includeInactive: true,
      );
    }
  }

  void _mostrarFormularioRotulo({LabelTemplate? rotulo}) {
    showDialog(
      context: context,
      builder: (context) => _FormularioRotuloDialog(rotulo: rotulo),
    );
  }

  Future<void> _confirmarDeletar(LabelTemplate rotulo) async {
    final confirmar = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppTheme.dark800,
        title: const Text('Confirmar Exclusão', style: TextStyle(color: Colors.white)),
        content: Text(
          'Tem certeza que deseja deletar o rótulo "${rotulo.name}"?',
          style: const TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancelar'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Deletar'),
          ),
        ],
      ),
    );

    if (confirmar == true && mounted) {
      final auth = context.read<AuthProvider>();
      final templatesProvider = context.read<LabelTemplatesProvider>();
      
      final clientId = auth.user?.clientId;
      final token = await auth.authToken;

      try {
        await LabelTemplatesService().deletarRotulo(
          id: rotulo.id,
          clientId: clientId!,
          authToken: token,
        );

        await _carregarRotulos();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Rótulo deletado com sucesso'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Erro ao deletar rótulo: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              color: AppTheme.dark900,
              padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 16.0),
              child: Row(
                children: [
                  HeaderButton(
                    iconPath: 'assets/icons/voltar.svg',
                    onTap: () => Navigator.pop(context),
                    size: 32,
                    tooltip: 'Voltar',
                  ),
                  const SizedBox(width: 16),
                  const Expanded(
                    child: Text(
                      'Rótulos Cadastrados',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  GestureDetector(
                    onTap: () => _mostrarFormularioRotulo(),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.primary,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(
                        PhosphorIcons.plus,
                        color: Colors.white,
                        size: 24,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Lista de rótulos
            Expanded(
              child: Consumer<LabelTemplatesProvider>(
                builder: (context, provider, child) {
                  if (provider.isLoading) {
                    return Center(
                      child: CircularProgressIndicator(color: AppTheme.primary),
                    );
                  }

                  if (provider.error != null) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(PhosphorIcons.warning, size: 48, color: Colors.red),
                          const SizedBox(height: 16),
                          Text(
                            provider.error!,
                            style: const TextStyle(color: Colors.red),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _carregarRotulos,
                            child: const Text('Tentar Novamente'),
                          ),
                        ],
                      ),
                    );
                  }

                  if (!provider.hasTemplates) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(PhosphorIcons.fileX, size: 64, color: AppTheme.dark400),
                          const SizedBox(height: 16),
                          Text(
                            'Nenhum rótulo cadastrado',
                            style: TextStyle(
                              color: AppTheme.dark300,
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Clique no botão + para criar seu primeiro rótulo',
                            style: TextStyle(color: AppTheme.dark400, fontSize: 14),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: provider.templates.length,
                    itemBuilder: (context, index) {
                      final rotulo = provider.templates[index];
                      return _buildRotuloCard(rotulo);
                    },
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRotuloCard(LabelTemplate rotulo) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppTheme.dark800,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.dark700),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: rotulo.isActive 
                      ? AppTheme.primary.withOpacity(0.2)
                      : AppTheme.dark600,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  PhosphorIcons.tag,
                  color: rotulo.isActive ? AppTheme.primary : AppTheme.dark400,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      rotulo.name,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: rotulo.isActive ? Colors.white : AppTheme.dark400,
                      ),
                    ),
                    if (rotulo.description != null && rotulo.description!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        rotulo.description!,
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.dark300,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Info chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _buildInfoChip(
                '${rotulo.fieldsSchema.fields.length} campos',
                PhosphorIcons.textbox,
                AppTheme.dark300,
              ),
              _buildInfoChip(
                '${rotulo.requiredFields.length} obrigatórios',
                PhosphorIcons.asterisk,
                Colors.orange,
              ),
              if (!rotulo.isActive)
                _buildInfoChip(
                  'Inativo',
                  PhosphorIcons.xCircle,
                  Colors.red,
                ),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Botões de ação
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _mostrarFormularioRotulo(rotulo: rotulo),
                  icon: const Icon(PhosphorIcons.pencil, size: 16),
                  label: const Text('Editar'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppTheme.primary,
                    side: BorderSide(color: AppTheme.primary),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () => _confirmarDeletar(rotulo),
                icon: const Icon(PhosphorIcons.trash, size: 16),
                label: const Text('Deletar'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.red,
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(String label, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}

// Dialog para criar/editar rótulo
class _FormularioRotuloDialog extends StatefulWidget {
  final LabelTemplate? rotulo;

  const _FormularioRotuloDialog({this.rotulo});

  @override
  State<_FormularioRotuloDialog> createState() => _FormularioRotuloDialogState();
}

class _FormularioRotuloDialogState extends State<_FormularioRotuloDialog> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _descricaoController = TextEditingController();
  final _templateIdController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.rotulo != null) {
      _nomeController.text = widget.rotulo!.name;
      _descricaoController.text = widget.rotulo!.description ?? '';
      _templateIdController.text = widget.rotulo!.tagmentTemplateId;
    }
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _descricaoController.dispose();
    _templateIdController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEdicao = widget.rotulo != null;

    return Dialog(
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          child: Form(
            key: _formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  isEdicao ? 'Editar Rótulo' : 'Novo Rótulo',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 20),

                // Nome
                Text(
                  'Nome do Rótulo *',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _nomeController,
                  decoration: InputDecoration(
                    hintText: 'Ex: Rótulo Nutricional Padrão',
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                  ),
                  style: const TextStyle(color: Colors.white),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Nome é obrigatório';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Descrição
                Text(
                  'Descrição',
                  style: TextStyle(
                    color: AppTheme.dark300,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _descricaoController,
                  decoration: InputDecoration(
                    hintText: 'Descreva este tipo de rótulo',
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                  ),
                  style: const TextStyle(color: Colors.white),
                  maxLines: 3,
                ),

                const SizedBox(height: 16),

                // Template ID do Tagment
                Text(
                  'ID do Template Tagment *',
                  style: TextStyle(
                    color: AppTheme.primary,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _templateIdController,
                  decoration: InputDecoration(
                    hintText: 'UUID do template no Tagment Studio',
                    filled: true,
                    fillColor: AppTheme.dark700,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: AppTheme.dark600),
                    ),
                  ),
                  style: const TextStyle(color: Colors.white, fontSize: 13),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Template ID é obrigatório';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 20),

                // Nota sobre campos
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.blue.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(PhosphorIcons.info, color: Colors.blue, size: 18),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Os campos do formulário serão configurados no próximo passo',
                          style: TextStyle(
                            color: Colors.blue.shade200,
                            fontSize: 12,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Botões
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(
                      onPressed: () => Navigator.pop(context),
                      child: const Text('Cancelar'),
                    ),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      onPressed: () {
                        if (_formKey.currentState!.validate()) {
                          // TODO: Salvar rótulo com campos padrão
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Funcionalidade de salvar será implementada em breve'),
                              backgroundColor: Colors.orange,
                            ),
                          );
                          Navigator.pop(context);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      ),
                      child: Text(isEdicao ? 'Salvar' : 'Criar'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

