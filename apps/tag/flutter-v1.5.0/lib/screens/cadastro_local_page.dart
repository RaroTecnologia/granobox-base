import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../models/storage_location_models.dart';
import '../providers/storage_locations_provider.dart';

class CadastroLocalPage extends StatefulWidget {
  final StorageLocation? local;

  const CadastroLocalPage({super.key, this.local});

  @override
  State<CadastroLocalPage> createState() => _CadastroLocalPageState();
}

class _CadastroLocalPageState extends State<CadastroLocalPage> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _descricaoController = TextEditingController();
  final _temperaturaController = TextEditingController();
  final _capacidadeController = TextEditingController();
  final _setorController = TextEditingController();

  String _tipoSelecionado = 'geladeira';
  bool _ativo = true;
  bool _isLoading = false;

  final List<Map<String, dynamic>> _tiposArmazenamento = [
    {'value': 'geladeira', 'label': 'Geladeira', 'icon': PhosphorIcons.snowflake},
    {'value': 'freezer', 'label': 'Freezer', 'icon': PhosphorIcons.snowflake},
    {'value': 'prateleira', 'label': 'Prateleira', 'icon': PhosphorIcons.package},
    {'value': 'estoque', 'label': 'Estoque', 'icon': PhosphorIcons.house},
    {'value': 'balcao', 'label': 'Balcão', 'icon': PhosphorIcons.mapPin},
    {'value': 'outro', 'label': 'Outro', 'icon': PhosphorIcons.mapPin},
  ];

  @override
  void initState() {
    super.initState();
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

  StorageLocationType _getType(String value) {
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
      default:
        return StorageLocationType.outro;
    }
  }

  Future<void> _salvar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _isLoading = true;
    });
    final provider = context.read<StorageLocationsProvider>();
    try {
      if (widget.local == null) {
        final req = CreateStorageLocationRequest(
          nome: _nomeController.text.trim(),
          tipo: _getType(_tipoSelecionado),
          descricao: _descricaoController.text.trim().isEmpty ? null : _descricaoController.text.trim(),
          temperatura: _temperaturaController.text.trim().isEmpty ? null : double.tryParse(_temperaturaController.text.trim()),
          capacidade: _capacidadeController.text.trim().isEmpty ? null : int.tryParse(_capacidadeController.text.trim()),
          setor: _setorController.text.trim().isEmpty ? null : _setorController.text.trim(),
          ativo: _ativo,
        );
        await provider.createStorageLocation(req);
      } else {
        final req = UpdateStorageLocationRequest(
          nome: _nomeController.text.trim(),
          tipo: _getType(_tipoSelecionado),
          descricao: _descricaoController.text.trim().isEmpty ? null : _descricaoController.text.trim(),
          temperatura: _temperaturaController.text.trim().isEmpty ? null : double.tryParse(_temperaturaController.text.trim()),
          capacidade: _capacidadeController.text.trim().isEmpty ? null : int.tryParse(_capacidadeController.text.trim()),
          setor: _setorController.text.trim().isEmpty ? null : _setorController.text.trim(),
          ativo: _ativo,
        );
        await provider.updateStorageLocation(widget.local!.id, req);
      }
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erro ao salvar: $e'), backgroundColor: Colors.red),
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
    return Scaffold(
      backgroundColor: AppTheme.dark900,
      appBar: AppBar(
        backgroundColor: AppTheme.dark900,
        toolbarHeight: 80,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          isEditando ? 'Editar Local' : 'Novo Local',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          if (_isLoading)
            Container(
              padding: const EdgeInsets.all(16),
              child: const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
            )
          else
            Container(
              margin: const EdgeInsets.only(right: 16),
              child: ElevatedButton(
                onPressed: _salvar,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                ),
                child: const Text(
                  'Salvar',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                ),
              ),
            ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // alinhado com produto
                TextFormField(
                  controller: _nomeController,
                  decoration: _inputDecoration('Nome do Local *'),
                  style: const TextStyle(color: Colors.white),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Nome é obrigatório' : null,
                ),
                const SizedBox(height: 12),

                // Tipo e Setor
                Row(
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<String>(
                        value: _tipoSelecionado,
                        dropdownColor: AppTheme.dark700,
                        style: const TextStyle(color: Colors.white),
                        decoration: _inputDecoration('Tipo de Armazenamento *'),
                        items: _tiposArmazenamento.map((t) => DropdownMenuItem<String>(
                          value: t['value'],
                          child: Row(children: [Icon(t['icon'], size: 18, color: AppTheme.dark300), const SizedBox(width: 8), Text(t['label'])]),
                        )).toList(),
                        onChanged: (v) => setState(() { if (v != null) _tipoSelecionado = v; }),
                        validator: (v) => (v == null || v.isEmpty) ? 'Selecione um tipo' : null,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _setorController,
                        decoration: _inputDecoration('Setor'),
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                // Temperatura e Capacidade
                Row(
                  children: [
                    Expanded(
                      child: TextFormField(
                        controller: _temperaturaController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        decoration: _inputDecoration('Temperatura (°C)'),
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: TextFormField(
                        controller: _capacidadeController,
                        keyboardType: TextInputType.number,
                        decoration: _inputDecoration('Capacidade (L)'),
                        style: const TextStyle(color: Colors.white),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                TextFormField(
                  controller: _descricaoController,
                  maxLines: 3,
                  decoration: _inputDecoration('Descrição'),
                  style: const TextStyle(color: Colors.white),
                ),
                const SizedBox(height: 16),

                // Status
                Row(
                  children: [
                    Icon(_ativo ? PhosphorIcons.checkCircle : PhosphorIcons.xCircle, color: _ativo ? Colors.green : Colors.red, size: 20),
                    const SizedBox(width: 8),
                    Text(_ativo ? 'Ativo' : 'Inativo', style: TextStyle(color: _ativo ? Colors.green : Colors.red, fontWeight: FontWeight.w600)),
                    const Spacer(),
                    Switch(
                      value: _ativo,
                      onChanged: (v) => setState(() { _ativo = v; }),
                      activeColor: Colors.green,
                      inactiveThumbColor: Colors.red,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ),
      ),
    );
  }

  InputDecoration _inputDecoration(String label) {
    return InputDecoration(
      labelText: label,
      labelStyle: TextStyle(color: AppTheme.dark300),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.dark600)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.dark600)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppTheme.primary, width: 2)),
      filled: true,
      fillColor: AppTheme.dark700,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
    );
  }
}


