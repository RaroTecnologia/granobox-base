// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'template_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TemplateElement _$TemplateElementFromJson(Map<String, dynamic> json) =>
    TemplateElement(
      type: json['type'] as String?,
      x: json['x'] as num?,
      y: json['y'] as num?,
      value: json['value'] as String?,
      fontSize: json['fontSize'] as num?,
      fontFamily: json['fontFamily'] as String?,
      width: json['width'] as num?,
      height: json['height'] as num?,
      thickness: json['thickness'] as num?,
      align: json['align'] as String?,
      rotation: json['rotation'] as num?,
      alignment: json['alignment'] as String?,
      color: json['color'] as String?,
      textTransform: json['textTransform'] as String?,
      linkedVariable: json['linkedVariable'] as String?,
      hideIfEmpty: json['hideIfEmpty'] as bool?,
      imageUrl: json['imageUrl'] as String?,
      imageFormat: json['imageFormat'] as String?,
      imageData: json['imageData'] as String?,
      imageId: json['imageId'] as String?,
      fallbackImageId: json['fallbackImageId'] as String?,
      fieldWidth: json['fieldWidth'] as num?,
      maxLines: json['maxLines'] as num?,
    );

Map<String, dynamic> _$TemplateElementToJson(TemplateElement instance) =>
    <String, dynamic>{
      'type': instance.type,
      'x': instance.x,
      'y': instance.y,
      'value': instance.value,
      'fontSize': instance.fontSize,
      'fontFamily': instance.fontFamily,
      'width': instance.width,
      'height': instance.height,
      'thickness': instance.thickness,
      'align': instance.align,
      'rotation': instance.rotation,
      'alignment': instance.alignment,
      'color': instance.color,
      'textTransform': instance.textTransform,
      'linkedVariable': instance.linkedVariable,
      'hideIfEmpty': instance.hideIfEmpty,
      'imageUrl': instance.imageUrl,
      'imageFormat': instance.imageFormat,
      'imageData': instance.imageData,
      'imageId': instance.imageId,
      'fallbackImageId': instance.fallbackImageId,
      'fieldWidth': instance.fieldWidth,
      'maxLines': instance.maxLines,
    };

TemplateSize _$TemplateSizeFromJson(Map<String, dynamic> json) => TemplateSize(
  w: json['w'] as num?,
  h: json['h'] as num?,
  unit: json['unit'] as String?,
);

Map<String, dynamic> _$TemplateSizeToJson(TemplateSize instance) =>
    <String, dynamic>{'w': instance.w, 'h': instance.h, 'unit': instance.unit};

TemplateLabelLayout _$TemplateLabelLayoutFromJson(Map<String, dynamic> json) =>
    TemplateLabelLayout(
      columns: (json['columns'] as num).toInt(),
      columnGap: json['columnGap'] as num,
      labelWidth: json['labelWidth'] as num,
    );

Map<String, dynamic> _$TemplateLabelLayoutToJson(
  TemplateLabelLayout instance,
) => <String, dynamic>{
  'columns': instance.columns,
  'columnGap': instance.columnGap,
  'labelWidth': instance.labelWidth,
};

Template _$TemplateFromJson(Map<String, dynamic> json) => Template(
  id: json['id'] as String,
  name: json['name'] as String,
  description: json['description'] as String?,
  isPublic: json['isPublic'] as bool?,
  customerId: json['customerId'] as String?,
  tenantId: json['tenantId'] as String?,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
  templateType: json['templateType'] as String?,
  size: json['size'] == null
      ? null
      : TemplateSize.fromJson(json['size'] as Map<String, dynamic>),
  elements: (json['elements'] as List<dynamic>?)
      ?.map((e) => TemplateElement.fromJson(e as Map<String, dynamic>))
      .toList(),
  labelLayout: json['labelLayout'] == null
      ? null
      : TemplateLabelLayout.fromJson(
          json['labelLayout'] as Map<String, dynamic>,
        ),
);

Map<String, dynamic> _$TemplateToJson(Template instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'isPublic': instance.isPublic,
  'customerId': instance.customerId,
  'tenantId': instance.tenantId,
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
  'templateType': instance.templateType,
  'size': instance.size,
  'elements': instance.elements,
  'labelLayout': instance.labelLayout,
};

ClientTemplateAssociation _$ClientTemplateAssociationFromJson(
  Map<String, dynamic> json,
) => ClientTemplateAssociation(
  id: json['id'] as String,
  clientId: json['clientId'] as String,
  labelType: json['labelType'] as String,
  templateId: json['templateId'] as String,
  createdAt: DateTime.parse(json['createdAt'] as String),
);

Map<String, dynamic> _$ClientTemplateAssociationToJson(
  ClientTemplateAssociation instance,
) => <String, dynamic>{
  'id': instance.id,
  'clientId': instance.clientId,
  'labelType': instance.labelType,
  'templateId': instance.templateId,
  'createdAt': instance.createdAt.toIso8601String(),
};
