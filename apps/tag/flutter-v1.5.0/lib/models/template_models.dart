import 'package:json_annotation/json_annotation.dart';

part 'template_models.g.dart';

/// Representa um elemento dentro de um template do tipo 'elements'
@JsonSerializable()
class TemplateElement {
  final String? type; // 'text', 'qr', 'line', 'image', 'shape'
  final num? x;
  final num? y;
  final String? value;
  final num? fontSize;
  final String? fontFamily;
  final num? width;
  final num? height;
  final num? thickness;
  final String? align;
  final num? rotation;
  final String? alignment;
  final String? color;
  final String? textTransform;
  final String? linkedVariable;
  final bool? hideIfEmpty;
  final String? imageUrl;
  final String? imageFormat;
  final String? imageData;
  final String? imageId;
  final String? fallbackImageId;
  final num? fieldWidth;
  final num? maxLines;

  TemplateElement({
    this.type,
    this.x,
    this.y,
    this.value,
    this.fontSize,
    this.fontFamily,
    this.width,
    this.height,
    this.thickness,
    this.align,
    this.rotation,
    this.alignment,
    this.color,
    this.textTransform,
    this.linkedVariable,
    this.hideIfEmpty,
    this.imageUrl,
    this.imageFormat,
    this.imageData,
    this.imageId,
    this.fallbackImageId,
    this.fieldWidth,
    this.maxLines,
  });

  factory TemplateElement.fromJson(Map<String, dynamic> json) =>
      _$TemplateElementFromJson(json);
  Map<String, dynamic> toJson() => _$TemplateElementToJson(this);
}

/// Representa o tamanho do template
@JsonSerializable()
class TemplateSize {
  final num? w;
  final num? h;
  final String? unit; // 'mm' ou 'inches'

  TemplateSize({
    this.w,
    this.h,
    this.unit,
  });

  factory TemplateSize.fromJson(Map<String, dynamic> json) =>
      _$TemplateSizeFromJson(json);
  Map<String, dynamic> toJson() => _$TemplateSizeToJson(this);
}

/// Representa o layout de múltiplas colunas do template
@JsonSerializable()
class TemplateLabelLayout {
  final int columns; // Número de colunas (1, 2, 3...)
  final num columnGap; // Espaçamento entre colunas em mm
  final num labelWidth; // Largura individual de cada etiqueta em mm

  TemplateLabelLayout({
    required this.columns,
    required this.columnGap,
    required this.labelWidth,
  });

  factory TemplateLabelLayout.fromJson(Map<String, dynamic> json) =>
      _$TemplateLabelLayoutFromJson(json);
  Map<String, dynamic> toJson() => _$TemplateLabelLayoutToJson(this);
  
  /// Verifica se é um template multi-coluna
  bool get isMultiColumn => columns > 1;
}

@JsonSerializable()
class Template {
  final String id;
  final String name;
  final String? description;
  final bool? isPublic; // Pode ser null na API do Tagment
  final String? customerId;
  final String? tenantId; // Campo do Tagment
  final DateTime? createdAt; // Pode ser null
  final DateTime? updatedAt; // Pode ser null
  
  // Novos campos para templates personalizados
  final String? templateType; // 'elements' ou 'studio'
  final TemplateSize? size;
  final List<TemplateElement>? elements;
  final TemplateLabelLayout? labelLayout; // Layout multi-coluna

  Template({
    required this.id,
    required this.name,
    this.description,
    this.isPublic,
    this.customerId,
    this.tenantId,
    this.createdAt,
    this.updatedAt,
    this.templateType,
    this.size,
    this.elements,
    this.labelLayout,
  });

  factory Template.fromJson(Map<String, dynamic> json) => _$TemplateFromJson(json);
  Map<String, dynamic> toJson() => _$TemplateToJson(this);
  
  bool get isGranoboxDefault => id == '1c12926f-849b-4bd7-8a61-05036f39f443';
  bool get isPrivate => !(isPublic ?? false);
  bool get isElementsType => templateType == 'elements' || templateType == null;
  
  /// Verifica se é um template multi-coluna
  bool get isMultiColumn => labelLayout != null && labelLayout!.isMultiColumn;
  
  /// Extrai todas as variáveis (placeholders) do template
  /// Retorna uma lista de nomes únicos de variáveis encontradas nos elementos
  List<String> extractVariables() {
    if (elements == null || elements!.isEmpty) return [];
    
    final regex = RegExp(r'\{\{(\w+)\}\}');
    final variables = <String>{};
    
    for (final element in elements!) {
      if (element.value != null) {
        final matches = regex.allMatches(element.value!);
        for (final match in matches) {
          variables.add(match.group(1)!);
        }
      }
    }
    
    return variables.toList();
  }
  
  /// Verifica se o template tem variáveis personalizadas (não padrão do Granobox)
  bool get hasCustomVariables {
    final standardVars = {
      'produto_nome', 'nome', 'lote', 'data_manipulacao', 'data_validade',
      'validade', 'hora_validade', 'operador', 'sif', 'marca', 'peso',
      'unidade', 'conservacao', 'observacao', 'quantidade', 'qrcode'
    };
    
    final vars = extractVariables();
    return vars.any((v) => !standardVars.contains(v.toLowerCase()));
  }
}

@JsonSerializable()
class ClientTemplateAssociation {
  final String id;
  final String clientId;
  final String labelType; // 'validity', 'product', etc
  final String templateId;
  final DateTime createdAt;

  ClientTemplateAssociation({
    required this.id,
    required this.clientId,
    required this.labelType,
    required this.templateId,
    required this.createdAt,
  });

  factory ClientTemplateAssociation.fromJson(Map<String, dynamic> json) => 
    _$ClientTemplateAssociationFromJson(json);
  Map<String, dynamic> toJson() => _$ClientTemplateAssociationToJson(this);
}

