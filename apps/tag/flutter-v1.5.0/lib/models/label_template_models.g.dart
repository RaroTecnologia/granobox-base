// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_template_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

FieldValidation _$FieldValidationFromJson(Map<String, dynamic> json) =>
    FieldValidation(
      min: (json['min'] as num?)?.toInt(),
      max: (json['max'] as num?)?.toInt(),
      minLength: (json['minLength'] as num?)?.toInt(),
      maxLength: (json['maxLength'] as num?)?.toInt(),
      pattern: json['pattern'] as String?,
      options: (json['options'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
    );

Map<String, dynamic> _$FieldValidationToJson(FieldValidation instance) =>
    <String, dynamic>{
      'min': instance.min,
      'max': instance.max,
      'minLength': instance.minLength,
      'maxLength': instance.maxLength,
      'pattern': instance.pattern,
      'options': instance.options,
    };

CalculateFrom _$CalculateFromFromJson(Map<String, dynamic> json) =>
    CalculateFrom(
      field: json['field'] as String,
      operation: json['operation'] as String,
      value: (json['value'] as num?)?.toInt(),
      productField: json['productField'] as String?,
    );

Map<String, dynamic> _$CalculateFromToJson(CalculateFrom instance) =>
    <String, dynamic>{
      'field': instance.field,
      'operation': instance.operation,
      'value': instance.value,
      'productField': instance.productField,
    };

AutoGenerate _$AutoGenerateFromJson(Map<String, dynamic> json) => AutoGenerate(
  pattern: json['pattern'] as String,
  prefix: json['prefix'] as String?,
  suffix: json['suffix'] as String?,
);

Map<String, dynamic> _$AutoGenerateToJson(AutoGenerate instance) =>
    <String, dynamic>{
      'pattern': instance.pattern,
      'prefix': instance.prefix,
      'suffix': instance.suffix,
    };

FieldSchema _$FieldSchemaFromJson(Map<String, dynamic> json) => FieldSchema(
  name: json['name'] as String,
  label: json['label'] as String,
  type: $enumDecode(_$FieldTypeEnumMap, json['type']),
  required: json['required'] as bool,
  defaultValue: json['defaultValue'],
  placeholder: json['placeholder'] as String?,
  helpText: json['helpText'] as String?,
  autoFillFromProduct: json['autoFillFromProduct'] as bool?,
  productField: json['productField'] as String?,
  validation: json['validation'] == null
      ? null
      : FieldValidation.fromJson(json['validation'] as Map<String, dynamic>),
  prefix: json['prefix'] as String?,
  suffix: json['suffix'] as String?,
  decimalPlaces: (json['decimalPlaces'] as num?)?.toInt(),
  rows: (json['rows'] as num?)?.toInt(),
  options: (json['options'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  minDate: json['minDate'] as String?,
  maxDate: json['maxDate'] as String?,
  calculateFrom: json['calculateFrom'] == null
      ? null
      : CalculateFrom.fromJson(json['calculateFrom'] as Map<String, dynamic>),
  autoGenerate: json['autoGenerate'] == null
      ? null
      : AutoGenerate.fromJson(json['autoGenerate'] as Map<String, dynamic>),
  readonly: json['readonly'] as bool?,
  hidden: json['hidden'] as bool?,
  order: (json['order'] as num?)?.toInt(),
);

Map<String, dynamic> _$FieldSchemaToJson(FieldSchema instance) =>
    <String, dynamic>{
      'name': instance.name,
      'label': instance.label,
      'type': _$FieldTypeEnumMap[instance.type]!,
      'required': instance.required,
      'defaultValue': instance.defaultValue,
      'placeholder': instance.placeholder,
      'helpText': instance.helpText,
      'autoFillFromProduct': instance.autoFillFromProduct,
      'productField': instance.productField,
      'validation': instance.validation,
      'prefix': instance.prefix,
      'suffix': instance.suffix,
      'decimalPlaces': instance.decimalPlaces,
      'rows': instance.rows,
      'options': instance.options,
      'minDate': instance.minDate,
      'maxDate': instance.maxDate,
      'calculateFrom': instance.calculateFrom,
      'autoGenerate': instance.autoGenerate,
      'readonly': instance.readonly,
      'hidden': instance.hidden,
      'order': instance.order,
    };

const _$FieldTypeEnumMap = {
  FieldType.text: 'text',
  FieldType.textarea: 'textarea',
  FieldType.number: 'number',
  FieldType.decimal: 'decimal',
  FieldType.date: 'date',
  FieldType.select: 'select',
  FieldType.boolean: 'boolean',
  FieldType.image: 'image',
};

LabelTemplateSchema _$LabelTemplateSchemaFromJson(Map<String, dynamic> json) =>
    LabelTemplateSchema(
      fields: (json['fields'] as List<dynamic>)
          .map((e) => FieldSchema.fromJson(e as Map<String, dynamic>))
          .toList(),
      version: json['version'] as String?,
    );

Map<String, dynamic> _$LabelTemplateSchemaToJson(
  LabelTemplateSchema instance,
) => <String, dynamic>{'fields': instance.fields, 'version': instance.version};

LabelTemplate _$LabelTemplateFromJson(Map<String, dynamic> json) =>
    LabelTemplate(
      id: json['id'] as String,
      clientId: json['clientId'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      tagmentTemplateId: json['tagmentTemplateId'] as String,
      fieldsSchema: LabelTemplateSchema.fromJson(
        json['fieldsSchema'] as Map<String, dynamic>,
      ),
      categoryIds: (json['categoryIds'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      productIds: (json['productIds'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      isActive: json['isActive'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$LabelTemplateToJson(LabelTemplate instance) =>
    <String, dynamic>{
      'id': instance.id,
      'clientId': instance.clientId,
      'name': instance.name,
      'description': instance.description,
      'tagmentTemplateId': instance.tagmentTemplateId,
      'fieldsSchema': instance.fieldsSchema,
      'categoryIds': instance.categoryIds,
      'productIds': instance.productIds,
      'isActive': instance.isActive,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

RenderableSchema _$RenderableSchemaFromJson(
  Map<String, dynamic> json,
) => RenderableSchema(
  template: LabelTemplate.fromJson(json['template'] as Map<String, dynamic>),
  schema: LabelTemplateSchema.fromJson(json['schema'] as Map<String, dynamic>),
  autoFilledValues: json['autoFilledValues'] as Map<String, dynamic>?,
  product: json['product'] as Map<String, dynamic>?,
);

Map<String, dynamic> _$RenderableSchemaToJson(RenderableSchema instance) =>
    <String, dynamic>{
      'template': instance.template,
      'schema': instance.schema,
      'autoFilledValues': instance.autoFilledValues,
      'product': instance.product,
    };

CreateLabelTemplateDto _$CreateLabelTemplateDtoFromJson(
  Map<String, dynamic> json,
) => CreateLabelTemplateDto(
  clientId: json['clientId'] as String,
  name: json['name'] as String,
  description: json['description'] as String?,
  tagmentTemplateId: json['tagmentTemplateId'] as String,
  fieldsSchema: LabelTemplateSchema.fromJson(
    json['fieldsSchema'] as Map<String, dynamic>,
  ),
  categoryIds: (json['categoryIds'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  productIds: (json['productIds'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  isActive: json['isActive'] as bool?,
);

Map<String, dynamic> _$CreateLabelTemplateDtoToJson(
  CreateLabelTemplateDto instance,
) => <String, dynamic>{
  'clientId': instance.clientId,
  'name': instance.name,
  'description': instance.description,
  'tagmentTemplateId': instance.tagmentTemplateId,
  'fieldsSchema': instance.fieldsSchema,
  'categoryIds': instance.categoryIds,
  'productIds': instance.productIds,
  'isActive': instance.isActive,
};

UpdateLabelTemplateDto _$UpdateLabelTemplateDtoFromJson(
  Map<String, dynamic> json,
) => UpdateLabelTemplateDto(
  name: json['name'] as String?,
  description: json['description'] as String?,
  tagmentTemplateId: json['tagmentTemplateId'] as String?,
  fieldsSchema: json['fieldsSchema'] == null
      ? null
      : LabelTemplateSchema.fromJson(
          json['fieldsSchema'] as Map<String, dynamic>,
        ),
  categoryIds: (json['categoryIds'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  productIds: (json['productIds'] as List<dynamic>?)
      ?.map((e) => e as String)
      .toList(),
  isActive: json['isActive'] as bool?,
);

Map<String, dynamic> _$UpdateLabelTemplateDtoToJson(
  UpdateLabelTemplateDto instance,
) => <String, dynamic>{
  'name': instance.name,
  'description': instance.description,
  'tagmentTemplateId': instance.tagmentTemplateId,
  'fieldsSchema': instance.fieldsSchema,
  'categoryIds': instance.categoryIds,
  'productIds': instance.productIds,
  'isActive': instance.isActive,
};
