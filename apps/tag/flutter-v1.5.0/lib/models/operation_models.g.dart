// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'operation_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Operation _$OperationFromJson(Map<String, dynamic> json) => Operation(
  id: json['id'] as String,
  name: json['name'] as String,
  description: json['description'] as String?,
  isActive: json['isActive'] as bool,
  clientId: json['clientId'] as String,
  agentFingerprint: json['agentFingerprint'] as String?,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
);

Map<String, dynamic> _$OperationToJson(Operation instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'description': instance.description,
  'isActive': instance.isActive,
  'clientId': instance.clientId,
  'agentFingerprint': instance.agentFingerprint,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
};

CreateOperationRequest _$CreateOperationRequestFromJson(
  Map<String, dynamic> json,
) => CreateOperationRequest(
  name: json['name'] as String,
  description: json['description'] as String?,
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$CreateOperationRequestToJson(
  CreateOperationRequest instance,
) => <String, dynamic>{
  'name': instance.name,
  'description': instance.description,
  'isActive': instance.isActive,
};

UpdateOperationRequest _$UpdateOperationRequestFromJson(
  Map<String, dynamic> json,
) => UpdateOperationRequest(
  name: json['name'] as String?,
  description: json['description'] as String?,
  isActive: json['isActive'] as bool?,
);

Map<String, dynamic> _$UpdateOperationRequestToJson(
  UpdateOperationRequest instance,
) => <String, dynamic>{
  'name': instance.name,
  'description': instance.description,
  'isActive': instance.isActive,
};
