import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import '../models/storage_location_models.dart';

class ModalArmazenamento extends StatefulWidget {
  final StorageLocation? local; // null para cadastro, preenchido para edição
  final Function(dynamic) onSalvar;

  const ModalArmazenamento({
    super.key,
    this.local,
    required this.onSalvar,
  });

  @override
  State<ModalArmazenamento> createState() => _ModalArmazenamentoState();
}

class _ModalArmazenamentoState extends State<ModalArmazenamento> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _descricaoController = TextEditingController();
  final _temperaturaController = TextEditingController();
  final _capacidadeController = TextEditingController();
  final _setorController = TextEditingController();
  
  String _tipoSelecionado = 'geladeira';
  bool _ativo = true;
  bool _isLoading = false;

  // Tipos de armazenamento disponíveis
  final List<Map<String, dynamic>> _tiposArmazenamento = [
    {
      'value': 'geladeira',
      'label': 'Geladeira',
      'icon': PhosphorIcons.snowflake,
      'color': Colors.blue,
      'description': 'Refrigeração (0°C a 8°C)',
    },
    {
      'value': 'freezer',
      'label': 'Freezer',
      'icon': PhosphorIcons.snowflake,
      'color': Colors.cyan,
      'description': 'Congelamento (-18°C ou menos)',
    },
    {
      'value': 'prateleira',
      'label': 'Prateleira',
      'icon': PhosphorIcons.package,
      'color': Colors.amber,
      'description': 'Armazenamento ambiente',
    },
    {
      'value': 'estoque',
      'label': 'Estoque',
      'icon': PhosphorIcons.house,
      'color': Colors.grey,
      'description': 'Área de estoque geral',
    },
    {
      'value': 'balcao',
      'label': 'Balcão',
      'icon': PhosphorIcons.mapPin,
      'color': Colors.green,
      'description': 'Área de exposição/venda',
    },
    {
      'value': 'outro',
      'label': 'Outro',
      'icon': PhosphorIcons.mapPin,
      'color': Colors.purple,
      'description': 'Outro tipo de local',
    },
  ];

  @override
  void initState() {
    super.initState();
    
    // Se está editando, preencher os campos
    if (widget.local != null) {
      _nomeController.text = widget.local!.nome;
      _descricaoController.text = widget.local!.descricao ?? '';
      _temperaturaController.text = widget.local!.temperatura?.toString() ?? '';
      _capacidadeController.text = widget.local!.capacidade?.toString() ?? '';
      _setorController.text = widget.local!.setor ?? '';
      _tipoSelecionado = widget.local!.tipo.value;
      _ativo = widget.local!.ativo;
    }
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _descricaoController.dispose();
    _temperaturaController.dispose();
    _capacidadeController.dispose();
    _setorController.dispose();
    super.dispose();
  }

  StorageLocationType _getStorageLocationTypeFromString(String value) {
    switch (value) {
      case 'geladeira':
        return StorageLocationType.geladeira;
      case 'freezer':
        return StorageLocationType.freezer;
      case 'prateleira':
        return StorageLocationType.prateleira;
      case 'estoque':
        return StorageLocationType.estoque;
      case 'balcao':
        return StorageLocationType.balcao;
      case 'outro':
        return StorageLocationType.outro;
      default:
        return StorageLocationType.prateleira;
    }
  }

  void _salvarLocal() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      // Criar o objeto de request baseado no tipo de operação
      dynamic request;
      
      if (widget.local == null) {
        // Criando novo local
        request = CreateStorageLocationRequest(
          nome: _nomeController.text.trim(),
          tipo: _getStorageLocationTypeFromString(_tipoSelecionado),
          descricao: _descricaoController.text.trim().isEmpty ? null : _descricaoController.text.trim(),
          temperatura: _temperaturaController.text.trim().isEmpty ? null : double.tryParse(_temperaturaController.text.trim()),
          capacidade: _capacidadeController.text.trim().isEmpty ? null : int.tryParse(_capacidadeController.text.trim()),
          setor: _setorController.text.trim().isEmpty ? null : _setorController.text.trim(),
          ativo: _ativo,
        );
      } else {
        // Editando local existente
        request = UpdateStorageLocationRequest(
          nome: _nomeController.text.trim(),
          tipo: _getStorageLocationTypeFromString(_tipoSelecionado),
          descricao: _descricaoController.text.trim().isEmpty ? null : _descricaoController.text.trim(),
          temperatura: _temperaturaController.text.trim().isEmpty ? null : double.tryParse(_temperaturaController.text.trim()),
          capacidade: _capacidadeController.text.trim().isEmpty ? null : int.tryParse(_capacidadeController.text.trim()),
          setor: _setorController.text.trim().isEmpty ? null : _setorController.text.trim(),
          ativo: _ativo,
        );
      }

      // Chamar callback para salvar
      await widget.onSalvar(request);
      
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              widget.local == null 
                ? 'Local de armazenamento criado com sucesso!' 
                : 'Local de armazenamento atualizado com sucesso!'
            ),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Erro ao salvar: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditando = widget.local != null;

    final Widget content = _buildContent(isEditando);
    return Dialog(
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: content,
    );
  }

  Widget _buildContent(bool isEditando) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 720, maxHeight: 700),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.dark700,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Icon(
                    isEditando ? PhosphorIcons.pencilSimple : PhosphorIcons.plus,
                    color: AppTheme.primary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        isEditando ? 'Editar Local' : 'Novo Local',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        isEditando ? 'Modifique as informações do local' : 'Cadastre um novo local de armazenamento',
                        style: TextStyle(
                          fontSize: 14,
                          color: AppTheme.dark400,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(
                    PhosphorIcons.x,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ],
            ),
          ),

          // Formulário
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Nome (obrigatório)
                    _buildFormField(
                      label: 'Nome do Local *',
                      hint: 'Ex: Geladeira Principal, Freezer A, Prateleira 1',
                      controller: _nomeController,
                      icon: PhosphorIcons.mapPin,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Nome é obrigatório';
                        }
                        return null;
                      },
                    ),

                    const SizedBox(height: 12),

                    // Tipo de armazenamento e Setor (lado a lado)
                    Row(
                      children: [
                        Expanded(child: _buildTipoSelector()),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildFormField(
                            label: 'Setor',
                            hint: 'Ex: Cozinha, Depósito, Loja',
                            controller: _setorController,
                            icon: PhosphorIcons.mapPin,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Temperatura e Capacidade
                    Row(
                      children: [
                        Expanded(
                          child: _buildFormField(
                            label: 'Temperatura (°C)',
                            hint: 'Ex: 4, -18, 25',
                            controller: _temperaturaController,
                            icon: PhosphorIcons.thermometer,
                            keyboardType: TextInputType.numberWithOptions(decimal: true),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: _buildFormField(
                            label: 'Capacidade (L)',
                            hint: 'Ex: 100, 200',
                            controller: _capacidadeController,
                            icon: PhosphorIcons.package,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Descrição
                    _buildFormField(
                      label: 'Descrição',
                      hint: 'Informações adicionais sobre o local',
                      controller: _descricaoController,
                      icon: PhosphorIcons.info,
                      maxLines: 3,
                    ),

                    const SizedBox(height: 12),

                    // Status ativo/inativo
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.transparent),
                      ),
                      child: Row(
                        children: [
                          Icon(
                            _ativo ? PhosphorIcons.checkCircle : PhosphorIcons.xCircle,
                            color: _ativo ? Colors.green : Colors.red,
                            size: 20,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Status',
                                  style: TextStyle(
                                    color: AppTheme.dark300,
                                    fontSize: 14,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                                Text(
                                  _ativo ? 'Ativo' : 'Inativo',
                                  style: TextStyle(
                                    color: _ativo ? Colors.green : Colors.red,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Switch(
                            value: _ativo,
                            onChanged: (value) {
                              setState(() {
                                _ativo = value;
                              });
                            },
                            activeColor: Colors.green,
                            inactiveThumbColor: Colors.red,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // Footer com botões
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: AppTheme.dark700,
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _isLoading ? null : () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppTheme.dark300,
                      side: BorderSide(color: AppTheme.dark600),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Cancelar',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _salvarLocal,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: _isLoading
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : Text(
                            isEditando ? 'Atualizar' : 'Criar',
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFormField({
    required String label,
    required String hint,
    required TextEditingController controller,
    required IconData icon,
    String? Function(String?)? validator,
    TextInputType? keyboardType,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.dark700,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.dark600),
          ),
          child: TextFormField(
            controller: controller,
            validator: validator,
            keyboardType: keyboardType,
            maxLines: maxLines,
            style: const TextStyle(color: Colors.white, fontSize: 16),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: TextStyle(color: AppTheme.dark400, fontSize: 14),
              prefixIcon: Icon(icon, color: AppTheme.primary, size: 20),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTipoSelector() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Tipo de Armazenamento *',
          style: TextStyle(
            color: AppTheme.dark300,
            fontSize: 14,
            fontWeight: FontWeight.w500,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppTheme.dark700,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppTheme.dark600),
          ),
          child: DropdownButtonFormField<String>(
            value: _tipoSelecionado,
            onChanged: (value) {
              if (value != null) {
                setState(() {
                  _tipoSelecionado = value;
                });
              }
            },
            validator: (value) {
              if (value == null || value.isEmpty) {
                return 'Tipo é obrigatório';
              }
              return null;
            },
            dropdownColor: AppTheme.dark700,
            style: const TextStyle(color: Colors.white, fontSize: 16),
            decoration: InputDecoration(
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
              prefixIcon: Icon(
                _tiposArmazenamento.firstWhere((tipo) => tipo['value'] == _tipoSelecionado)['icon'],
                color: AppTheme.primary,
                size: 20,
              ),
            ),
            items: _tiposArmazenamento.map((tipo) {
              return DropdownMenuItem<String>(
                value: tipo['value'],
                child: Row(
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: BoxDecoration(
                        color: tipo['color'].withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        tipo['icon'],
                        color: tipo['color'],
                        size: 14,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            tipo['label'],
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            tipo['description'],
                            style: TextStyle(
                              color: AppTheme.dark400,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }
}
