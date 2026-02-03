// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_item_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LabelItem _$LabelItemFromJson(Map<String, dynamic> json) => LabelItem(
  id: json['id'] as String,
  clientId: json['clientId'] as String,
  labelTemplateId: json['labelTemplateId'] as String,
  name: json['name'] as String,
  code: json['code'] as String?,
  data: json['data'] as Map<String, dynamic>,
  isActive: json['isActive'] as bool,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$LabelItemToJson(LabelItem instance) => <String, dynamic>{
  'id': instance.id,
  'clientId': instance.clientId,
  'labelTemplateId': instance.labelTemplateId,
  'name': instance.name,
  'code': instance.code,
  'data': instance.data,
  'isActive': instance.isActive,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
};

CreateLabelItemDto _$CreateLabelItemDtoFromJson(Map<String, dynamic> json) =>
    CreateLabelItemDto(
      clientId: json['clientId'] as String,
      labelTemplateId: json['labelTemplateId'] as String,
      name: json['name'] as String,
      code: json['code'] as String?,
      data: json['data'] as Map<String, dynamic>?,
      isActive: json['isActive'] as bool?,
    );

Map<String, dynamic> _$CreateLabelItemDtoToJson(CreateLabelItemDto instance) =>
    <String, dynamic>{
      'clientId': instance.clientId,
      'labelTemplateId': instance.labelTemplateId,
      'name': instance.name,
      'code': instance.code,
      'data': instance.data,
      'isActive': instance.isActive,
    };

UpdateLabelItemDto _$UpdateLabelItemDtoFromJson(Map<String, dynamic> json) =>
    UpdateLabelItemDto(
      clientId: json['clientId'] as String?,
      labelTemplateId: json['labelTemplateId'] as String?,
      name: json['name'] as String?,
      code: json['code'] as String?,
      data: json['data'] as Map<String, dynamic>?,
      isActive: json['isActive'] as bool?,
    );

Map<String, dynamic> _$UpdateLabelItemDtoToJson(UpdateLabelItemDto instance) =>
    <String, dynamic>{
      'clientId': instance.clientId,
      'labelTemplateId': instance.labelTemplateId,
      'name': instance.name,
      'code': instance.code,
      'data': instance.data,
      'isActive': instance.isActive,
    };
