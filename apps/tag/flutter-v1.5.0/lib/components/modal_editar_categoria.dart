import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import 'package:provider/provider.dart';
import '../theme/app_theme.dart';
import '../models/category_models.dart';
import '../providers/categories_products_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/print_provider.dart'; // ⭐ NOVO
import '../models/print_result_models.dart'; // ⭐ NOVO: Para PrinterInfo
import '../utils/culinary_icons.dart'; // ⭐ NOVO: Para ícones culinários
import 'custom_icon.dart'; // Para renderizar SVGs

class ModalEditarCategoria extends StatefulWidget {
  final Category categoria;

  const ModalEditarCategoria({
    Key? key,
    required this.categoria,
  }) : super(key: key);

  @override
  State<ModalEditarCategoria> createState() => _ModalEditarCategoriaState();
}

class _ModalEditarCategoriaState extends State<ModalEditarCategoria> {
  final _formKey = GlobalKey<FormState>();
  final _nomeController = TextEditingController();
  final _templateController = TextEditingController();
  
  bool _isLoading = false;
  String? _categoriaPaiSelecionada;
  String? _impressoraSelecionada; // ⭐ NOVO
  String? _iconeSelecionado; // ⭐ NOVO: Nome do ícone selecionado

  @override
  void initState() {
    super.initState();
    _preencherCampos();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadPrinters();
    });
  }

  void _preencherCampos() {
    _nomeController.text = widget.categoria.name;
    _categoriaPaiSelecionada = widget.categoria.parentId;
    _templateController.text = widget.categoria.defaultTemplateId ?? '';
    _impressoraSelecionada = widget.categoria.defaultPrinterId;
    _iconeSelecionado = widget.categoria.icon; // ⭐ NOVO
    print('📝 [ModalEditarCategoria] Preenchendo campos:');
    print('   defaultPrinterId da categoria: ${widget.categoria.defaultPrinterId}');
    print('   _impressoraSelecionada: $_impressoraSelecionada');
    print('   icon da categoria: ${widget.categoria.icon}');
  }

  @override
  void dispose() {
    _nomeController.dispose();
    _templateController.dispose();
    super.dispose();
  }

  Future<void> _loadPrinters() async {
    final auth = context.read<AuthProvider>();
    final printProvider = context.read<PrintProvider>();
    final token = await auth.authToken;

    if (token != null) {
      await printProvider.carregarImpressoras(
        forceRefresh: true,
        token: token,
        clientId: auth.user?.clientId,
      );
      
      // Verificar se a impressora selecionada ainda existe na lista
      if (_impressoraSelecionada != null) {
        final impressoraExiste = printProvider.impressoras.any(
          (p) => p.id == _impressoraSelecionada,
        );
        print('🔍 [ModalEditarCategoria] Verificando impressora selecionada:');
        print('   ID selecionado: $_impressoraSelecionada');
        print('   Impressora existe na lista: $impressoraExiste');
        print('   IDs disponíveis: ${printProvider.impressoras.map((p) => '${p.id} (${p.displayName})').join(', ')}');
        
        if (!impressoraExiste) {
          print('⚠️ [ModalEditarCategoria] Impressora selecionada não encontrada! Limpando seleção.');
          setState(() {
            _impressoraSelecionada = null;
          });
        }
      }
    }
  }

  // Função auxiliar para obter nome amigável da impressora
  // Usa o nome salvo no backend (que pode ser renomeado pelo usuário)
  // Se o nome for MAC ou vazio, tenta usar brand/model como fallback
  String _getPrinterDisplayName(PrinterInfo printer) {
    // Se o displayName está vazio ou é apenas espaços, usar fallback
    if (printer.displayName.trim().isEmpty) {
      // Tentar usar brand/model se disponível
      if (printer.brand != null && printer.brand!.isNotEmpty) {
        final parts = <String>[];
        parts.add(printer.brand!);
        if (printer.model != null && printer.model!.isNotEmpty) {
          parts.add(printer.model!);
        }
        if (parts.isNotEmpty) {
          return parts.join(' ');
        }
      }
      // Se não tiver brand/model, usar edgeAgentFingerprint
      if (printer.edgeAgentFingerprint != null) {
        return 'Edge ${printer.edgeAgentFingerprint}';
      }
      // Último fallback: usar parte do ID
      return 'Impressora ${printer.id.substring(0, 8)}';
    }
    
    // Verificar se o displayName parece ser um MAC address
    final macPattern = RegExp(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$');
    final isMac = macPattern.hasMatch(printer.displayName);
    
    if (isMac) {
      // Se for MAC, tentar usar brand/model como nome principal
      if (printer.brand != null && printer.brand!.isNotEmpty) {
        final parts = <String>[];
        parts.add(printer.brand!);
        if (printer.model != null && printer.model!.isNotEmpty) {
          parts.add(printer.model!);
        }
        if (parts.isNotEmpty) {
          return parts.join(' ');
        }
      }
      // Se não tiver brand/model, usar edgeAgentFingerprint
      if (printer.edgeAgentFingerprint != null) {
        return 'Edge ${printer.edgeAgentFingerprint}';
      }
      // Se não tiver nada, mostrar que precisa renomear
      return 'Impressora (renomear)';
    }
    
    // Nome válido (não é MAC e não está vazio) - usar diretamente
    return printer.displayName;
  }

  Future<void> _salvarCategoria() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();
      final token = await authProvider.authToken;

      if (token == null) {
        _mostrarErro('Token de autenticação não encontrado');
        return;
      }

      print('💾 [ModalEditarCategoria] Salvando categoria:');
      print('   defaultPrinterId selecionado: $_impressoraSelecionada');
      
      // Verificar se a impressora selecionada existe na lista
      if (_impressoraSelecionada != null) {
        final printProvider = context.read<PrintProvider>();
        final impressoraExiste = printProvider.impressoras.any(
          (p) => p.id == _impressoraSelecionada,
        );
        if (impressoraExiste) {
          final printer = printProvider.impressoras.firstWhere(
            (p) => p.id == _impressoraSelecionada,
          );
          print('   ✅ Impressora encontrada: ${_getPrinterDisplayName(printer)} (ID: ${printer.id})');
        } else {
          print('   ⚠️ AVISO: Impressora selecionada não encontrada na lista!');
          print('   IDs disponíveis: ${printProvider.impressoras.map((p) => '${p.id} (${_getPrinterDisplayName(p)})').join(', ')}');
        }
      }
      
      final updateRequest = UpdateCategoryRequest(
        name: _nomeController.text.trim(),
        parentId: _categoriaPaiSelecionada,
        defaultTemplateId: _templateController.text.trim().isEmpty ? null : _templateController.text.trim(),
        defaultPrinterId: _impressoraSelecionada,
        icon: _iconeSelecionado, // ⭐ NOVO
        isActive: widget.categoria.isActive,
      );
      
      print('   UpdateRequest.defaultPrinterId: ${updateRequest.defaultPrinterId}');

      final categoriesProvider = context.read<CategoriesProductsProvider>();
      final categoriaAtualizada = await categoriesProvider.updateCategory(
        widget.categoria.id,
        updateRequest,
        token: token,
      );

      if (categoriaAtualizada != null) {
        if (mounted) {
          Navigator.of(context).pop(categoriaAtualizada);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Categoria atualizada com sucesso!'),
              backgroundColor: Colors.green,
            ),
          );
        }
      } else {
        _mostrarErro('Erro ao atualizar categoria');
      }
    } catch (e) {
      _mostrarErro('Erro ao atualizar categoria: ${e.toString()}');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _mostrarErro(String mensagem) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(mensagem),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _mostrarSeletorIcone() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) => Container(
        padding: EdgeInsets.all(24),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Selecionar Ícone',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            Flexible(
              child: GridView.builder(
                shrinkWrap: true,
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 4,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.0,
                ),
                itemCount: CulinaryIcons.icons.length + 1, // +1 para opção "Nenhum"
                itemBuilder: (context, index) {
                  if (index == 0) {
                    // Opção "Nenhum"
                    final isSelected = _iconeSelecionado == null;
                    return GestureDetector(
                      onTap: () {
                        setState(() {
                          _iconeSelecionado = null;
                        });
                        Navigator.pop(context);
                      },
                      child: Container(
                        decoration: BoxDecoration(
                          color: AppTheme.dark700,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: isSelected ? AppTheme.primary : AppTheme.dark600,
                            width: isSelected ? 2 : 1,
                          ),
                        ),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              PhosphorIcons.x,
                              color: isSelected ? AppTheme.primary : AppTheme.dark400,
                              size: 24,
                            ),
                            SizedBox(height: 4),
                            Text(
                              'Nenhum',
                              style: TextStyle(
                                color: isSelected ? Colors.white : AppTheme.dark300,
                                fontSize: 10,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                    );
                  }
                  
                  final iconData = CulinaryIcons.icons[index - 1];
                  final isSelected = _iconeSelecionado == iconData.name;
                  
                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        _iconeSelecionado = iconData.name;
                      });
                      Navigator.pop(context);
                    },
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected ? AppTheme.primary : AppTheme.dark600,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          // Renderizar SVG ou ícone PhosphorIcons
                          Builder(
                            builder: (context) {
                              if (iconData.svgPath != null) {
                                return CustomIcon(
                                  iconPath: iconData.svgPath!,
                                  size: 28,
                                  color: isSelected ? AppTheme.primary : AppTheme.dark300,
                                );
                              } else if (iconData.icon != null) {
                                return Icon(
                                  iconData.icon!,
                                  color: isSelected ? AppTheme.primary : AppTheme.dark300,
                                  size: 28,
                                );
                              } else {
                                // Fallback se não houver nem ícone nem SVG
                                return Icon(
                                  PhosphorIcons.package,
                                  color: isSelected ? AppTheme.primary : AppTheme.dark300,
                                  size: 28,
                                );
                              }
                            },
                          ),
                          SizedBox(height: 4),
                          Text(
                            iconData.label,
                            style: TextStyle(
                              color: isSelected ? Colors.white : AppTheme.dark300,
                              fontSize: 10,
                            ),
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _mostrarSeletorImpressora(PrintProvider printProvider) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      isScrollControlled: true,
      builder: (context) => Container(
        padding: EdgeInsets.all(24),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Selecionar Impressora',
              style: TextStyle(
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            Flexible(
              child: SingleChildScrollView(
                child: Column(
                  children: [
                    // Opção "Nenhuma"
                    GestureDetector(
                      onTap: () {
                        setState(() {
                          _impressoraSelecionada = null;
                        });
                        Navigator.pop(context);
                      },
                      child: Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.dark700,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: _impressoraSelecionada == null
                                ? AppTheme.primary
                                : AppTheme.dark600,
                            width: _impressoraSelecionada == null ? 2 : 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: _impressoraSelecionada == null
                                    ? AppTheme.primary.withOpacity(0.2)
                                    : AppTheme.dark600,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                PhosphorIcons.x,
                                color: _impressoraSelecionada == null
                                    ? AppTheme.primary
                                    : AppTheme.dark400,
                                size: 20,
                              ),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Usar regras gerais',
                                    style: TextStyle(
                                      color: _impressoraSelecionada == null
                                          ? Colors.white
                                          : AppTheme.dark300,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    'Impressora da tag ou padrão',
                                    style: TextStyle(
                                      color: AppTheme.dark400,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (_impressoraSelecionada == null)
                              Icon(
                                PhosphorIcons.checkCircle,
                                color: AppTheme.primary,
                                size: 20,
                              ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(height: 12),
                    // Lista de impressoras
                    ...printProvider.impressoras.map((printer) {
                      final isSelected = _impressoraSelecionada == printer.id;
                      return Padding(
                        padding: EdgeInsets.only(bottom: 12),
                        child: GestureDetector(
                          onTap: () {
                            setState(() {
                              _impressoraSelecionada = printer.id;
                            });
                            Navigator.pop(context);
                          },
                          child: Container(
                            padding: EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: AppTheme.dark700,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: isSelected
                                    ? AppTheme.primary
                                    : AppTheme.dark600,
                                width: isSelected ? 2 : 1,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(
                                    color: printer.isOnline
                                        ? Colors.green.withOpacity(0.2)
                                        : AppTheme.dark600,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Icon(
                                    PhosphorIcons.printer,
                                    color: printer.isOnline
                                        ? Colors.green
                                        : AppTheme.dark400,
                                    size: 20,
                                  ),
                                ),
                                SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              _getPrinterDisplayName(printer),
                                              style: TextStyle(
                                                color: isSelected
                                                    ? Colors.white
                                                    : AppTheme.dark300,
                                                fontSize: 14,
                                                fontWeight: FontWeight.w600,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          Container(
                                            padding: EdgeInsets.symmetric(
                                              horizontal: 6,
                                              vertical: 2,
                                            ),
                                            decoration: BoxDecoration(
                                              color: printer.isOnline
                                                  ? Colors.green.withOpacity(0.2)
                                                  : Colors.orange.withOpacity(0.2),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Text(
                                              printer.isOnline ? 'Online' : 'Offline',
                                              style: TextStyle(
                                                color: printer.isOnline
                                                    ? Colors.green
                                                    : Colors.orange,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                      SizedBox(height: 4),
                                      if (printer.brand != null || printer.model != null)
                                        Text(
                                          [
                                            printer.brand,
                                            printer.model,
                                          ].where((e) => e != null && e.isNotEmpty).join(' • '),
                                          style: TextStyle(
                                            color: AppTheme.dark400,
                                            fontSize: 11,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        )
                                      else if (printer.location != null)
                                        Text(
                                          printer.location!,
                                          style: TextStyle(
                                            color: AppTheme.dark400,
                                            fontSize: 11,
                                          ),
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                    ],
                                  ),
                                ),
                                SizedBox(width: 8),
                                if (isSelected)
                                  Icon(
                                    PhosphorIcons.checkCircle,
                                    color: AppTheme.primary,
                                    size: 20,
                                  ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }).toList(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: AppTheme.dark800,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        width: MediaQuery.of(context).size.width * 0.9,
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      PhosphorIcons.pencilSimple,
                      color: AppTheme.primary,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Editar Categoria',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Atualize as informações da categoria',
                          style: TextStyle(
                            color: AppTheme.dark300,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: Icon(
                      PhosphorIcons.x,
                      color: AppTheme.dark300,
                      size: 24,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Nome da categoria
              TextFormField(
                controller: _nomeController,
                decoration: InputDecoration(
                  labelText: 'Nome da Categoria *',
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
                    return 'Nome da categoria é obrigatório';
                  }
                  if (value.trim().length < 2) {
                    return 'Nome deve ter pelo menos 2 caracteres';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),

              // Template de Etiqueta (opcional)
              TextFormField(
                controller: _templateController,
                decoration: InputDecoration(
                  labelText: 'Template ID (opcional)',
                  hintText: 'UUID do template do Tagment',
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
              ),

              const SizedBox(height: 16),

              // ⭐ NOVO: Seletor de Ícone
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Ícone da Categoria (opcional)',
                    style: TextStyle(
                      color: AppTheme.dark300,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  SizedBox(height: 8),
                  GestureDetector(
                    onTap: () => _mostrarSeletorIcone(),
                    child: Container(
                      padding: EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppTheme.dark700,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppTheme.dark600,
                          width: 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 40,
                            height: 40,
                            decoration: BoxDecoration(
                              color: _iconeSelecionado != null
                                  ? AppTheme.primary.withOpacity(0.2)
                                  : AppTheme.dark600,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: _iconeSelecionado != null && CulinaryIcons.isSvg(_iconeSelecionado)
                                ? CustomIcon(
                                    iconPath: CulinaryIcons.getSvgPathByName(_iconeSelecionado)!,
                                    size: 20,
                                    color: AppTheme.primary,
                                  )
                                : Icon(
                                    _iconeSelecionado != null
                                        ? CulinaryIcons.getIconByName(_iconeSelecionado) ?? PhosphorIcons.package
                                        : PhosphorIcons.package,
                                    color: _iconeSelecionado != null
                                        ? AppTheme.primary
                                        : AppTheme.dark400,
                                    size: 20,
                                  ),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              _iconeSelecionado != null
                                  ? (CulinaryIcons.getLabelByName(_iconeSelecionado) ?? 'Ícone selecionado')
                                  : 'Nenhum ícone selecionado',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          Icon(
                            PhosphorIcons.caretDown,
                            color: AppTheme.dark300,
                            size: 20,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 16),

            Consumer<PrintProvider>(
              builder: (context, printProvider, child) {
                // Função auxiliar para obter nome amigável da impressora
                String _getPrinterDisplayName(PrinterInfo printer) {
                  // Se o displayName parece ser um MAC address (formato XX:XX:XX:XX:XX:XX ou similar)
                  final macPattern = RegExp(r'^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$');
                  final isMac = macPattern.hasMatch(printer.displayName);
                  
                  if (isMac) {
                    // Se for MAC, tentar construir nome a partir de brand/model
                    if (printer.brand != null && printer.brand!.isNotEmpty) {
                      final parts = <String>[];
                      parts.add(printer.brand!);
                      if (printer.model != null && printer.model!.isNotEmpty) {
                        parts.add(printer.model!);
                      }
                      if (parts.isNotEmpty) {
                        // Adicionar identificador do Edge se disponível
                        if (printer.edgeAgentFingerprint != null) {
                          return '${parts.join(' ')} (${printer.edgeAgentFingerprint})';
                        }
                        return parts.join(' ');
                      }
                    }
                    // Se não tiver brand/model, usar edgeAgentFingerprint ou id como fallback
                    if (printer.edgeAgentFingerprint != null) {
                      return 'Edge ${printer.edgeAgentFingerprint}';
                    }
                    // Último fallback: usar parte do ID
                    return 'Impressora ${printer.id.substring(0, 8)}';
                  }
                  
                  // Se não for MAC, usar o displayName normalmente
                  // Mas se o displayName estiver vazio ou for apenas espaços, usar fallback
                  if (printer.displayName.trim().isEmpty) {
                    if (printer.brand != null && printer.brand!.isNotEmpty) {
                      return printer.brand! + (printer.model != null ? ' ${printer.model}' : '');
                    }
                    if (printer.edgeAgentFingerprint != null) {
                      return 'Edge ${printer.edgeAgentFingerprint}';
                    }
                    return 'Impressora ${printer.id.substring(0, 8)}';
                  }
                  
                  return printer.displayName;
                }

                // Obter impressora selecionada
                PrinterInfo? impressoraSelecionada;
                if (_impressoraSelecionada != null) {
                  try {
                    impressoraSelecionada = printProvider.impressoras.firstWhere(
                      (p) => p.id == _impressoraSelecionada,
                    );
                  } catch (e) {
                    impressoraSelecionada = null;
                  }
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Impressora padrão (opcional)',
                      style: TextStyle(
                        color: AppTheme.dark300,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    SizedBox(height: 8),
                    // Botão que abre modal de seleção
                    GestureDetector(
                      onTap: () => _mostrarSeletorImpressora(printProvider),
                      child: Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppTheme.dark700,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppTheme.dark600,
                            width: 1,
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: impressoraSelecionada != null
                                    ? (impressoraSelecionada!.isOnline
                                        ? Colors.green.withOpacity(0.2)
                                        : AppTheme.dark600)
                                    : AppTheme.primary.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                impressoraSelecionada != null
                                    ? PhosphorIcons.printer
                                    : PhosphorIcons.x,
                                color: impressoraSelecionada != null
                                    ? (impressoraSelecionada!.isOnline
                                        ? Colors.green
                                        : AppTheme.dark400)
                                    : AppTheme.primary,
                                size: 20,
                              ),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    impressoraSelecionada != null
                                        ? _getPrinterDisplayName(impressoraSelecionada!)
                                        : 'Usar regras gerais',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  SizedBox(height: 2),
                                  Text(
                                    impressoraSelecionada != null
                                        ? (impressoraSelecionada!.isOnline ? 'Online' : 'Offline')
                                        : 'Impressora da tag ou padrão',
                                    style: TextStyle(
                                      color: AppTheme.dark400,
                                      fontSize: 12,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Icon(
                              PhosphorIcons.caretDown,
                              color: AppTheme.dark300,
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),

            const SizedBox(height: 16),
              
              // Categoria Pai
              Consumer<CategoriesProductsProvider>(
                builder: (context, provider, child) {
                  // Filtrar categorias para não permitir selecionar a própria categoria ou suas filhas
                  final categoriasDisponiveis = provider.categories.where((cat) => 
                    cat.id != widget.categoria.id && 
                    cat.parentId != widget.categoria.id
                  ).toList();
                  
                  return DropdownButtonFormField<String>(
                    value: _categoriaPaiSelecionada,
                    decoration: InputDecoration(
                      labelText: 'Categoria Pai (opcional)',
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
                    items: [
                      DropdownMenuItem<String>(
                        value: null,
                        child: Text(
                          'Categoria raiz',
                          style: TextStyle(color: AppTheme.dark300),
                        ),
                      ),
                      ...categoriasDisponiveis.map((categoria) {
                        return DropdownMenuItem<String>(
                          value: categoria.id,
                          child: Text(categoria.name),
                        );
                      }).toList(),
                    ],
                    onChanged: (value) {
                      setState(() {
                        _categoriaPaiSelecionada = value;
                      });
                    },
                  );
                },
              ),
              
              const SizedBox(height: 24),
              
              // Botões de ação
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        side: BorderSide(color: AppTheme.dark600),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'Cancelar',
                        style: TextStyle(color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _salvarCategoria,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.primary,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text('Salvar'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}