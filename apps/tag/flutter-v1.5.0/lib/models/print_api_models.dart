import 'package:json_annotation/json_annotation.dart';

part 'print_api_models.g.dart';

/// Configuração do SDK Tagment
@JsonSerializable()
class PrintApiConfig {
  final String apiKey;
  final String baseUrl;
  final int timeout;

  const PrintApiConfig({
    required this.apiKey,
    this.baseUrl = 'https://api.tagment.com.br',
    this.timeout = 10000,
  });

  factory PrintApiConfig.fromJson(Map<String, dynamic> json) =>
      _$PrintApiConfigFromJson(json);

  Map<String, dynamic> toJson() => _$PrintApiConfigToJson(this);
}

/// Resultado de operações do SDK
@JsonSerializable(genericArgumentFactories: true)
class PrintApiResult<T> {
  final bool success;
  final T? data;
  final String? error;
  final int? remainingRequests;

  const PrintApiResult({
    required this.success,
    this.data,
    this.error,
    this.remainingRequests,
  });

  factory PrintApiResult.fromJson(
    Map<String, dynamic> json,
    T Function(Object? json) fromJsonT,
  ) =>
      _$PrintApiResultFromJson(json, fromJsonT);

  Map<String, dynamic> toJson(Object Function(T value) toJsonT) =>
      _$PrintApiResultToJson(this, toJsonT);
}

/// Request para processar template
@JsonSerializable()
class ProcessTemplateRequest {
  final String template;
  final Map<String, dynamic> data;

  const ProcessTemplateRequest({
    required this.template,
    required this.data,
  });

  factory ProcessTemplateRequest.fromJson(Map<String, dynamic> json) =>
      _$ProcessTemplateRequestFromJson(json);

  Map<String, dynamic> toJson() => _$ProcessTemplateRequestToJson(this);
}

/// Response do processamento de template
@JsonSerializable()
class ProcessTemplateResponse {
  final String zpl;
  final bool success;
  final int? remainingRequests;

  const ProcessTemplateResponse({
    required this.zpl,
    required this.success,
    this.remainingRequests,
  });

  factory ProcessTemplateResponse.fromJson(Map<String, dynamic> json) =>
      _$ProcessTemplateResponseFromJson(json);

  Map<String, dynamic> toJson() => _$ProcessTemplateResponseToJson(this);
}

/// Informações da API Key
@JsonSerializable()
class ApiKeyInfo {
  final bool isValid;
  final String tier;
  final ApiKeyLimits limits;
  final List<String> features;
  final int remainingRequests;
  final bool isActive;
  final String name;
  final String description;
  final String? expiresAt;
  final String? lastUsedAt;
  final String createdAt;

  const ApiKeyInfo({
    required this.isValid,
    required this.tier,
    required this.limits,
    required this.features,
    required this.remainingRequests,
    required this.isActive,
    required this.name,
    required this.description,
    this.expiresAt,
    this.lastUsedAt,
    required this.createdAt,
  });

  factory ApiKeyInfo.fromJson(Map<String, dynamic> json) =>
      _$ApiKeyInfoFromJson(json);

  Map<String, dynamic> toJson() => _$ApiKeyInfoToJson(this);
}

/// Limites da API Key
@JsonSerializable()
class ApiKeyLimits {
  final int maxTemplates;
  final int maxPrintsPerDay;
  final int requestsPerMonth;
  final int maxTemplatesPerDay;

  const ApiKeyLimits({
    required this.maxTemplates,
    required this.maxPrintsPerDay,
    required this.requestsPerMonth,
    required this.maxTemplatesPerDay,
  });

  factory ApiKeyLimits.fromJson(Map<String, dynamic> json) =>
      _$ApiKeyLimitsFromJson(json);

  Map<String, dynamic> toJson() => _$ApiKeyLimitsToJson(this);
}

/// Elemento de template
@JsonSerializable()
class TemplateElement {
  final String type;
  final String content;
  final int x;
  final int y;
  final Map<String, dynamic>? properties;

  const TemplateElement({
    required this.type,
    required this.content,
    required this.x,
    required this.y,
    this.properties,
  });

  factory TemplateElement.fromJson(Map<String, dynamic> json) =>
      _$TemplateElementFromJson(json);

  Map<String, dynamic> toJson() => _$TemplateElementToJson(this);
}

/// Template completo
@JsonSerializable()
class TagmentTemplate {
  final List<TemplateElement> elements;
  final Map<String, dynamic>? metadata;

  const TagmentTemplate({
    required this.elements,
    this.metadata,
  });

  factory TagmentTemplate.fromJson(Map<String, dynamic> json) =>
      _$TagmentTemplateFromJson(json);

  Map<String, dynamic> toJson() => _$TagmentTemplateToJson(this);
}
