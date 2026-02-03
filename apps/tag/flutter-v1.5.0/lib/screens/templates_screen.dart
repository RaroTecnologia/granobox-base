import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../models/template_models.dart';
import '../services/templates_service.dart';
import '../providers/auth_provider.dart';

class TemplatesScreen extends StatefulWidget {
  const TemplatesScreen({Key? key}) : super(key: key);

  @override
  State<TemplatesScreen> createState() => _TemplatesScreenState();
}

class _TemplatesScreenState extends State<TemplatesScreen> {
  final TemplatesService _templatesService = TemplatesService();
  final TextEditingController _codeController = TextEditingController();
  
  List<Template> _privateTemplates = [];
  List<Template> _publicTemplates = [];
  String? _defaultTemplateId;
  bool _isLoading = true;
  bool _isAddingByCode = false;

  @override
  void initState() {
    super.initState();
    _loadTemplates();
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _loadTemplates() async {
    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;
      final clientId = authProvider.user?.clientId;

      if (token == null || clientId == null) {
        throw Exception('Usuário não autenticado');
      }

      // Buscar todos os templates (públicos e privados)
      final templatesMap = await _templatesService.getAllTemplates(
        clientId: clientId,
        token: token,
      );
      
      _publicTemplates = templatesMap['public'] ?? [];
      _privateTemplates = templatesMap['private'] ?? [];

      // Carregar template padrão configurado
      _defaultTemplateId = await _templatesService.getDefaultTemplateIdForClient(
        clientId: clientId,
        labelType: 'validity',
        token: token,
      );

      print('✅ Templates carregados: ${_publicTemplates.length} públicos, ${_privateTemplates.length} privados');
      
      setState(() => _isLoading = false);
    } catch (e) {
      print('❌ Erro ao carregar templates: $e');
      setState(() => _isLoading = false);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao carregar templates: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _addTemplateByCode() async {
    if (_codeController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Por favor, insira um código de template'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;

      if (token == null) {
        throw Exception('Usuário não autenticado');
      }

      // Simplesmente recarregar a lista - o template já deve estar disponível
      await _loadTemplates();
      
      setState(() {
        _isAddingByCode = false;
        _codeController.clear();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Templates atualizados!'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      print('❌ Erro ao atualizar templates: $e');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _setAsDefault(Template template) async {
    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;
      final clientId = authProvider.user?.clientId;

      if (token == null || clientId == null) {
        throw Exception('Usuário não autenticado');
      }

      final success = await _templatesService.setDefaultTemplate(
        clientId: clientId,
        labelType: 'validity',
        templateId: template.id,
        token: token,
      );

      if (success) {
        setState(() {
          _defaultTemplateId = template.id;
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Template "${template.name}" definido como padrão'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        throw Exception('Falha ao definir template padrão');
      }
    } catch (e) {
      print('❌ Erro ao definir template padrão: $e');
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: AppTheme.primary),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Templates de Etiquetas',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              IconButton(
                onPressed: _loadTemplates,
                icon: const Icon(PhosphorIcons.arrowClockwise, color: AppTheme.primary),
                tooltip: 'Atualizar',
              ),
            ],
          ),
          
          const SizedBox(height: 24),
          
          // Templates Privados
          if (_privateTemplates.isNotEmpty) ...[
            _buildSectionHeader('Meus Templates Privados (${_privateTemplates.length})'),
            const SizedBox(height: 12),
            ..._privateTemplates.map((t) => 
              _buildTemplateCard(t, isDefault: _defaultTemplateId == t.id)
            ),
            const SizedBox(height: 32),
          ],
          
          // Templates Públicos
          _buildSectionHeader('Templates Públicos (${_publicTemplates.length})'),
          const SizedBox(height: 12),
          if (_publicTemplates.isEmpty)
            _buildEmptyState('Nenhum template público disponível')
          else
            ..._publicTemplates.map((t) => 
              _buildTemplateCard(t, isDefault: _defaultTemplateId == t.id)
            ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: AppTheme.dark200,
      ),
    );
  }

  Widget _buildTemplateCard(Template template, {bool isDefault = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDefault ? AppTheme.primary.withOpacity(0.1) : AppTheme.dark700,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isDefault ? AppTheme.primary : AppTheme.dark600,
          width: isDefault ? 2 : 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                PhosphorIcons.fileText,
                color: isDefault ? AppTheme.primary : AppTheme.dark300,
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            template.name,
                            style: TextStyle(
                              color: isDefault ? AppTheme.primary : Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        if (isDefault)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppTheme.primary,
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Text(
                              'PADRÃO',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                    if (template.description != null) ...[
                      const SizedBox(height: 4),
                      Text(
                        template.description!,
                        style: const TextStyle(
                          color: AppTheme.dark300,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
              Row(
                children: [
                  Icon(
                    template.isPrivate ? PhosphorIcons.lock : PhosphorIcons.globe,
                    size: 14,
                    color: template.isPrivate ? Colors.amber : AppTheme.primary,
                  ),
                  SizedBox(width: 6),
                  _buildInfoChip(
                    label: (template.isPublic ?? false) ? 'Público' : 'Privado',
                    color: (template.isPublic ?? false) ? AppTheme.primary : Colors.amber,
                  ),
                ],
              ),
          
          if (!isDefault) ...[
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _setAsDefault(template),
                icon: const Icon(PhosphorIcons.checkCircle, size: 16),
                label: const Text('Definir como Padrão'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.dark600,
                  foregroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildInfoChip({required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.2),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.5)),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildEmptyState(String message) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dark600),
      ),
      child: Center(
        child: Text(
          message,
          style: const TextStyle(
            color: AppTheme.dark300,
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildAddByCodeButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton.icon(
        onPressed: () => setState(() => _isAddingByCode = true),
        icon: const Icon(PhosphorIcons.plus, size: 20),
        label: const Text('Adicionar Template Público por Código'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppTheme.dark700,
          foregroundColor: AppTheme.primary,
          padding: const EdgeInsets.symmetric(vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppTheme.primary),
          ),
        ),
      ),
    );
  }

  Widget _buildAddByCodeForm() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.primary),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Adicionar Template Público',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Insira o código UUID do template público do Tagment',
            style: TextStyle(
              color: AppTheme.dark300,
              fontSize: 13,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _codeController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'ex: 1c12926f-849b-4bd7-8a61-05036f39f443',
              hintStyle: const TextStyle(color: AppTheme.dark400),
              filled: true,
              fillColor: AppTheme.dark800,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppTheme.dark600),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppTheme.dark600),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: AppTheme.primary),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: ElevatedButton(
                  onPressed: () => setState(() {
                    _isAddingByCode = false;
                    _codeController.clear();
                  }),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.dark600,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Cancelar'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: _addTemplateByCode,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text('Adicionar'),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

