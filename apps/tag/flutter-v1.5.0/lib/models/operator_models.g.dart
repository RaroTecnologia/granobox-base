// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'operator_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Operator _$OperatorFromJson(Map<String, dynamic> json) => Operator(
  id: json['id'] as String,
  name: json['name'] as String,
  pin: json['pin'] as String?,
  isActive: json['isActive'] as bool,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  role: json['role'] as String?,
  createdAt: json['createdAt'] == null
      ? null
      : DateTime.parse(json['createdAt'] as String),
  updatedAt: json['updatedAt'] == null
      ? null
      : DateTime.parse(json['updatedAt'] as String),
  clientId: json['clientId'] as String?,
);

Map<String, dynamic> _$OperatorToJson(Operator instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'pin': instance.pin,
  'isActive': instance.isActive,
  'email': instance.email,
  'phone': instance.phone,
  'role': instance.role,
  'createdAt': instance.createdAt?.toIso8601String(),
  'updatedAt': instance.updatedAt?.toIso8601String(),
  'clientId': instance.clientId,
};

CreateOperatorRequest _$CreateOperatorRequestFromJson(
  Map<String, dynamic> json,
) => CreateOperatorRequest(
  name: json['name'] as String,
  pin: json['pin'] as String?,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  role: json['role'] as String?,
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$CreateOperatorRequestToJson(
  CreateOperatorRequest instance,
) => <String, dynamic>{
  'name': instance.name,
  'pin': instance.pin,
  'email': instance.email,
  'phone': instance.phone,
  'role': instance.role,
  'isActive': instance.isActive,
};

UpdateOperatorRequest _$UpdateOperatorRequestFromJson(
  Map<String, dynamic> json,
) => UpdateOperatorRequest(
  name: json['name'] as String?,
  pin: json['pin'] as String?,
  email: json['email'] as String?,
  phone: json['phone'] as String?,
  role: json['role'] as String?,
  isActive: json['isActive'] as bool?,
);

Map<String, dynamic> _$UpdateOperatorRequestToJson(
  UpdateOperatorRequest instance,
) => <String, dynamic>{
  'name': instance.name,
  'pin': instance.pin,
  'email': instance.email,
  'phone': instance.phone,
  'role': instance.role,
  'isActive': instance.isActive,
};

OperatorsResponse _$OperatorsResponseFromJson(Map<String, dynamic> json) =>
    OperatorsResponse(
      operators: (json['operators'] as List<dynamic>)
          .map((e) => Operator.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num).toInt(),
      page: (json['page'] as num).toInt(),
      limit: (json['limit'] as num).toInt(),
    );

Map<String, dynamic> _$OperatorsResponseToJson(OperatorsResponse instance) =>
    <String, dynamic>{
      'operators': instance.operators,
      'total': instance.total,
      'page': instance.page,
      'limit': instance.limit,
    };

OperatorsCache _$OperatorsCacheFromJson(Map<String, dynamic> json) =>
    OperatorsCache(
      operators: (json['operators'] as List<dynamic>)
          .map((e) => Operator.fromJson(e as Map<String, dynamic>))
          .toList(),
      cachedAt: DateTime.parse(json['cachedAt'] as String),
      clientId: json['clientId'] as String,
    );

Map<String, dynamic> _$OperatorsCacheToJson(OperatorsCache instance) =>
    <String, dynamic>{
      'operators': instance.operators,
      'cachedAt': instance.cachedAt.toIso8601String(),
      'clientId': instance.clientId,
    };
