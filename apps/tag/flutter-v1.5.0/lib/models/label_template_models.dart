import 'package:json_annotation/json_annotation.dart';

part 'label_template_models.g.dart';

/// Tipos de campo suportados
enum FieldType {
  @JsonValue('text')
  text,
  @JsonValue('textarea')
  textarea,
  @JsonValue('number')
  number,
  @JsonValue('decimal')
  decimal,
  @JsonValue('date')
  date,
  @JsonValue('select')
  select,
  @JsonValue('boolean')
  boolean,
  @JsonValue('image')
  image,
}

/// Schema de validação de campo
@JsonSerializable()
class FieldValidation {
  final int? min;
  final int? max;
  final int? minLength;
  final int? maxLength;
  final String? pattern;
  final List<String>? options;

  FieldValidation({
    this.min,
    this.max,
    this.minLength,
    this.maxLength,
    this.pattern,
    this.options,
  });

  factory FieldValidation.fromJson(Map<String, dynamic> json) => _$FieldValidationFromJson(json);
  Map<String, dynamic> toJson() => _$FieldValidationToJson(this);
}

/// Configuração de cálculo automático
@JsonSerializable()
class CalculateFrom {
  final String field;
  final String operation; // 'add', 'subtract', 'multiply', 'divide'
  final int? value;
  final String? productField;

  CalculateFrom({
    required this.field,
    required this.operation,
    this.value,
    this.productField,
  });

  factory CalculateFrom.fromJson(Map<String, dynamic> json) => _$CalculateFromFromJson(json);
  Map<String, dynamic> toJson() => _$CalculateFromToJson(this);
}

/// Configuração de auto-geração
@JsonSerializable()
class AutoGenerate {
  final String pattern;
  final String? prefix;
  final String? suffix;

  AutoGenerate({
    required this.pattern,
    this.prefix,
    this.suffix,
  });

  factory AutoGenerate.fromJson(Map<String, dynamic> json) => _$AutoGenerateFromJson(json);
  Map<String, dynamic> toJson() => _$AutoGenerateToJson(this);
}

/// Schema de um campo do formulário
@JsonSerializable()
class FieldSchema {
  final String name;
  final String label;
  final FieldType type;
  final bool required;
  final dynamic defaultValue;
  final String? placeholder;
  final String? helpText;

  // Auto-fill do produto
  final bool? autoFillFromProduct;
  final String? productField;

  // Validações
  final FieldValidation? validation;

  // Para campos numéricos
  final String? prefix;
  final String? suffix;
  final int? decimalPlaces;

  // Para textarea
  final int? rows;

  // Para select
  final List<String>? options;

  // Para date
  final String? minDate;
  final String? maxDate;

  // Cálculos automáticos
  final CalculateFrom? calculateFrom;

  // Auto-gerar valores
  final AutoGenerate? autoGenerate;

  // UI
  final bool? readonly;
  final bool? hidden;
  final int? order;

  FieldSchema({
    required this.name,
    required this.label,
    required this.type,
    required this.required,
    this.defaultValue,
    this.placeholder,
    this.helpText,
    this.autoFillFromProduct,
    this.productField,
    this.validation,
    this.prefix,
    this.suffix,
    this.decimalPlaces,
    this.rows,
    this.options,
    this.minDate,
    this.maxDate,
    this.calculateFrom,
    this.autoGenerate,
    this.readonly,
    this.hidden,
    this.order,
  });

  factory FieldSchema.fromJson(Map<String, dynamic> json) => _$FieldSchemaFromJson(json);
  Map<String, dynamic> toJson() => _$FieldSchemaToJson(this);

  /// Verificar se o campo deve ser auto-preenchido
  bool get hasAutoFill => autoFillFromProduct == true && productField != null;

  /// Verificar se o campo tem cálculo automático
  bool get hasCalculation => calculateFrom != null;

  /// Verificar se o campo deve ser auto-gerado
  bool get hasAutoGenerate => autoGenerate != null;
}

/// Schema completo dos campos
@JsonSerializable()
class LabelTemplateSchema {
  final List<FieldSchema> fields;
  final String? version;

  LabelTemplateSchema({
    required this.fields,
    this.version,
  });

  factory LabelTemplateSchema.fromJson(Map<String, dynamic> json) => _$LabelTemplateSchemaFromJson(json);
  Map<String, dynamic> toJson() => _$LabelTemplateSchemaToJson(this);

  /// Obter campos ordenados
  List<FieldSchema> get orderedFields {
    final ordered = List<FieldSchema>.from(fields);
    ordered.sort((a, b) => (a.order ?? 999).compareTo(b.order ?? 999));
    return ordered;
  }

  /// Obter campos obrigatórios
  List<FieldSchema> get requiredFields => fields.where((f) => f.required).toList();

  /// Obter campos opcionais
  List<FieldSchema> get optionalFields => fields.where((f) => !f.required).toList();
}

/// Template de rótulo completo
@JsonSerializable()
class LabelTemplate {
  final String id;
  final String clientId;
  final String name;
  final String? description;
  final String tagmentTemplateId;
  final LabelTemplateSchema fieldsSchema;
  final List<String>? categoryIds;
  final List<String>? productIds;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  LabelTemplate({
    required this.id,
    required this.clientId,
    required this.name,
    this.description,
    required this.tagmentTemplateId,
    required this.fieldsSchema,
    this.categoryIds,
    this.productIds,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LabelTemplate.fromJson(Map<String, dynamic> json) => _$LabelTemplateFromJson(json);
  Map<String, dynamic> toJson() => _$LabelTemplateToJson(this);

  /// Verificar se template está disponível para uma categoria
  bool isAvailableForCategory(String categoryId) {
    if (categoryIds == null || categoryIds!.isEmpty) return true;
    return categoryIds!.contains(categoryId);
  }

  /// Verificar se template está disponível para um produto
  bool isAvailableForProduct(String productId) {
    if (productIds == null || productIds!.isEmpty) return true;
    return productIds!.contains(productId);
  }

  /// Obter campos obrigatórios
  List<FieldSchema> get requiredFields => fieldsSchema.requiredFields;

  /// Obter campos opcionais
  List<FieldSchema> get optionalFields => fieldsSchema.optionalFields;
}

/// Resposta da API ao buscar schema renderizável
@JsonSerializable()
class RenderableSchema {
  final LabelTemplate template;
  final LabelTemplateSchema schema;
  final Map<String, dynamic>? autoFilledValues;
  final Map<String, dynamic>? product;

  RenderableSchema({
    required this.template,
    required this.schema,
    this.autoFilledValues,
    this.product,
  });

  factory RenderableSchema.fromJson(Map<String, dynamic> json) => _$RenderableSchemaFromJson(json);
  Map<String, dynamic> toJson() => _$RenderableSchemaToJson(this);
}

/// DTO para criar template
@JsonSerializable()
class CreateLabelTemplateDto {
  final String clientId;
  final String name;
  final String? description;
  final String tagmentTemplateId;
  final LabelTemplateSchema fieldsSchema;
  final List<String>? categoryIds;
  final List<String>? productIds;
  final bool? isActive;

  CreateLabelTemplateDto({
    required this.clientId,
    required this.name,
    this.description,
    required this.tagmentTemplateId,
    required this.fieldsSchema,
    this.categoryIds,
    this.productIds,
    this.isActive,
  });

  factory CreateLabelTemplateDto.fromJson(Map<String, dynamic> json) => _$CreateLabelTemplateDtoFromJson(json);
  Map<String, dynamic> toJson() => _$CreateLabelTemplateDtoToJson(this);
}

/// DTO para atualizar template
@JsonSerializable()
class UpdateLabelTemplateDto {
  final String? name;
  final String? description;
  final String? tagmentTemplateId;
  final LabelTemplateSchema? fieldsSchema;
  final List<String>? categoryIds;
  final List<String>? productIds;
  final bool? isActive;

  UpdateLabelTemplateDto({
    this.name,
    this.description,
    this.tagmentTemplateId,
    this.fieldsSchema,
    this.categoryIds,
    this.productIds,
    this.isActive,
  });

  factory UpdateLabelTemplateDto.fromJson(Map<String, dynamic> json) => _$UpdateLabelTemplateDtoFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateLabelTemplateDtoToJson(this);
}


