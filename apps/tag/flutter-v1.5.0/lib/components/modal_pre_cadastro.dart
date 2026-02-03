import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';
import '../models/produto_pre_cadastro.dart';

class ModalPreCadastro extends StatefulWidget {
  final String? nomeSugerido;
  final Function(ProdutoPreCadastro) onSalvar;

  const ModalPreCadastro({
    super.key,
    this.nomeSugerido,
    required this.onSalvar,
  });

  @override
  State<ModalPreCadastro> createState() => _ModalPreCadastroState();
}

class _ModalPreCadastroState extends State<ModalPreCadastro> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _marcaController = TextEditingController();
  final _observacaoController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.nomeSugerido != null) {
      _nomeController.text = widget.nomeSugerido!;
    }
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _marcaController.dispose();
    _observacaoController.dispose();
    super.dispose();
  }

  void _salvarPreCadastro() {
    if (_formKey.currentState!.validate()) {
      final preCadastro = ProdutoPreCadastro(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        nomeProduto: _nomeController.text.trim(),
        marca: _marcaController.text.trim(),
        observacao: _observacaoController.text.trim().isEmpty 
            ? null 
            : _observacaoController.text.trim(),
        solicitadoPor: 'Operador Atual', // TODO: Pegar do contexto de usuário
        dataSolicitacao: DateTime.now(),
        status: StatusPreCadastro.pendente,
        empresaId: 'empresa_atual', // TODO: Pegar do contexto da empresa
      );

      widget.onSalvar(preCadastro);
      Navigator.pop(context);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
      child: Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    PhosphorIcons.plus,
                    color: AppTheme.primary,
                    size: 24,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Solicitar Cadastro',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        'Produto não encontrado no sistema',
                        style: TextStyle(
                          color: AppTheme.dark300,
                          fontSize: 14,
                        ),
                      ),
                    ],
                  ),
                ),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: Icon(
                    PhosphorIcons.x,
                    color: AppTheme.dark300,
                    size: 24,
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Formulário
            Form(
              key: _formKey,
              child: Column(
                children: [
                  // Nome do produto
                  TextFormField(
                    controller: _nomeController,
                    decoration: InputDecoration(
                      labelText: 'Nome do Produto *',
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
                    style: TextStyle(color: Colors.white),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Nome do produto é obrigatório';
                      }
                      return null;
                    },
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Marca
                  TextFormField(
                    controller: _marcaController,
                    decoration: InputDecoration(
                      labelText: 'Marca *',
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
                    style: TextStyle(color: Colors.white),
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return 'Marca é obrigatória';
                      }
                      return null;
                    },
                  ),
                  
                  const SizedBox(height: 16),
                  
                  // Observação
                  TextFormField(
                    controller: _observacaoController,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: 'Observação (opcional)',
                      labelStyle: TextStyle(color: AppTheme.dark300),
                      hintText: 'Ex: Produto novo, nunca compramos antes...',
                      hintStyle: TextStyle(color: AppTheme.dark400),
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
                    style: TextStyle(color: Colors.white),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Informação sobre o processo
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppTheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppTheme.primary.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  Icon(
                    PhosphorIcons.info,
                    color: AppTheme.primary,
                    size: 20,
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'Este produto será enviado para aprovação e ficará disponível após ser aprovado por um administrador.',
                      style: TextStyle(
                        color: AppTheme.primary,
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
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context),
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: AppTheme.dark600),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
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
                    onPressed: _salvarPreCadastro,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: const Text(
                      'Solicitar',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
