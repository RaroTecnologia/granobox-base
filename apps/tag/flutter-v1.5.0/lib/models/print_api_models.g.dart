// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'print_api_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

PrintApiConfig _$PrintApiConfigFromJson(Map<String, dynamic> json) =>
    PrintApiConfig(
      apiKey: json['apiKey'] as String,
      baseUrl: json['baseUrl'] as String? ?? 'https://api.tagment.com.br',
      timeout: (json['timeout'] as num?)?.toInt() ?? 10000,
    );

Map<String, dynamic> _$PrintApiConfigToJson(PrintApiConfig instance) =>
    <String, dynamic>{
      'apiKey': instance.apiKey,
      'baseUrl': instance.baseUrl,
      'timeout': instance.timeout,
    };

PrintApiResult<T> _$PrintApiResultFromJson<T>(
  Map<String, dynamic> json,
  T Function(Object? json) fromJsonT,
) => PrintApiResult<T>(
  success: json['success'] as bool,
  data: _$nullableGenericFromJson(json['data'], fromJsonT),
  error: json['error'] as String?,
  remainingRequests: (json['remainingRequests'] as num?)?.toInt(),
);

Map<String, dynamic> _$PrintApiResultToJson<T>(
  PrintApiResult<T> instance,
  Object? Function(T value) toJsonT,
) => <String, dynamic>{
  'success': instance.success,
  'data': _$nullableGenericToJson(instance.data, toJsonT),
  'error': instance.error,
  'remainingRequests': instance.remainingRequests,
};

T? _$nullableGenericFromJson<T>(
  Object? input,
  T Function(Object? json) fromJson,
) => input == null ? null : fromJson(input);

Object? _$nullableGenericToJson<T>(
  T? input,
  Object? Function(T value) toJson,
) => input == null ? null : toJson(input);

ProcessTemplateRequest _$ProcessTemplateRequestFromJson(
  Map<String, dynamic> json,
) => ProcessTemplateRequest(
  template: json['template'] as String,
  data: json['data'] as Map<String, dynamic>,
);

Map<String, dynamic> _$ProcessTemplateRequestToJson(
  ProcessTemplateRequest instance,
) => <String, dynamic>{'template': instance.template, 'data': instance.data};

ProcessTemplateResponse _$ProcessTemplateResponseFromJson(
  Map<String, dynamic> json,
) => ProcessTemplateResponse(
  zpl: json['zpl'] as String,
  success: json['success'] as bool,
  remainingRequests: (json['remainingRequests'] as num?)?.toInt(),
);

Map<String, dynamic> _$ProcessTemplateResponseToJson(
  ProcessTemplateResponse instance,
) => <String, dynamic>{
  'zpl': instance.zpl,
  'success': instance.success,
  'remainingRequests': instance.remainingRequests,
};

ApiKeyInfo _$ApiKeyInfoFromJson(Map<String, dynamic> json) => ApiKeyInfo(
  isValid: json['isValid'] as bool,
  tier: json['tier'] as String,
  limits: ApiKeyLimits.fromJson(json['limits'] as Map<String, dynamic>),
  features: (json['features'] as List<dynamic>)
      .map((e) => e as String)
      .toList(),
  remainingRequests: (json['remainingRequests'] as num).toInt(),
  isActive: json['isActive'] as bool,
  name: json['name'] as String,
  description: json['description'] as String,
  expiresAt: json['expiresAt'] as String?,
  lastUsedAt: json['lastUsedAt'] as String?,
  createdAt: json['createdAt'] as String,
);

Map<String, dynamic> _$ApiKeyInfoToJson(ApiKeyInfo instance) =>
    <String, dynamic>{
      'isValid': instance.isValid,
      'tier': instance.tier,
      'limits': instance.limits,
      'features': instance.features,
      'remainingRequests': instance.remainingRequests,
      'isActive': instance.isActive,
      'name': instance.name,
      'description': instance.description,
      'expiresAt': instance.expiresAt,
      'lastUsedAt': instance.lastUsedAt,
      'createdAt': instance.createdAt,
    };

ApiKeyLimits _$ApiKeyLimitsFromJson(Map<String, dynamic> json) => ApiKeyLimits(
  maxTemplates: (json['maxTemplates'] as num).toInt(),
  maxPrintsPerDay: (json['maxPrintsPerDay'] as num).toInt(),
  requestsPerMonth: (json['requestsPerMonth'] as num).toInt(),
  maxTemplatesPerDay: (json['maxTemplatesPerDay'] as num).toInt(),
);

Map<String, dynamic> _$ApiKeyLimitsToJson(ApiKeyLimits instance) =>
    <String, dynamic>{
      'maxTemplates': instance.maxTemplates,
      'maxPrintsPerDay': instance.maxPrintsPerDay,
      'requestsPerMonth': instance.requestsPerMonth,
      'maxTemplatesPerDay': instance.maxTemplatesPerDay,
    };

TemplateElement _$TemplateElementFromJson(Map<String, dynamic> json) =>
    TemplateElement(
      type: json['type'] as String,
      content: json['content'] as String,
      x: (json['x'] as num).toInt(),
      y: (json['y'] as num).toInt(),
      properties: json['properties'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$TemplateElementToJson(TemplateElement instance) =>
    <String, dynamic>{
      'type': instance.type,
      'content': instance.content,
      'x': instance.x,
      'y': instance.y,
      'properties': instance.properties,
    };

TagmentTemplate _$TagmentTemplateFromJson(Map<String, dynamic> json) =>
    TagmentTemplate(
      elements: (json['elements'] as List<dynamic>)
          .map((e) => TemplateElement.fromJson(e as Map<String, dynamic>))
          .toList(),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );

Map<String, dynamic> _$TagmentTemplateToJson(TagmentTemplate instance) =>
    <String, dynamic>{
      'elements': instance.elements,
      'metadata': instance.metadata,
    };
