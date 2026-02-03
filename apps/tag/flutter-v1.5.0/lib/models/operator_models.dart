import 'package:json_annotation/json_annotation.dart';

part 'operator_models.g.dart';

/// Modelo para operador/responsável
@JsonSerializable()
class Operator {
  final String id;
  final String name;
  final String? pin;
  final bool isActive;
  final String? email;
  final String? phone;
  final String? role;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final String? clientId;

  Operator({
    required this.id,
    required this.name,
    this.pin,
    required this.isActive,
    this.email,
    this.phone,
    this.role,
    this.createdAt,
    this.updatedAt,
    this.clientId,
  });

  factory Operator.fromJson(Map<String, dynamic> json) => _$OperatorFromJson(json);
  Map<String, dynamic> toJson() => _$OperatorToJson(this);

  /// Verificar se o operador tem PIN configurado
  bool get hasPin => pin != null && pin!.isNotEmpty;

  /// Verificar se o operador está ativo
  bool get isAvailable => isActive;

  @override
  String toString() => 'Operator(id: $id, name: $name, isActive: $isActive)';
}

/// DTO para criar operador
@JsonSerializable()
class CreateOperatorRequest {
  final String name;
  final String? pin;
  final String? email;
  final String? phone;
  final String? role;
  final bool isActive;

  CreateOperatorRequest({
    required this.name,
    this.pin,
    this.email,
    this.phone,
    this.role,
    this.isActive = true,
  });

  factory CreateOperatorRequest.fromJson(Map<String, dynamic> json) => _$CreateOperatorRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateOperatorRequestToJson(this);
}

/// DTO para atualizar operador
@JsonSerializable()
class UpdateOperatorRequest {
  final String? name;
  final String? pin;
  final String? email;
  final String? phone;
  final String? role;
  final bool? isActive;

  UpdateOperatorRequest({
    this.name,
    this.pin,
    this.email,
    this.phone,
    this.role,
    this.isActive,
  });

  factory UpdateOperatorRequest.fromJson(Map<String, dynamic> json) => _$UpdateOperatorRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateOperatorRequestToJson(this);
}

/// Resposta da API para lista de operadores
@JsonSerializable()
class OperatorsResponse {
  final List<Operator> operators;
  final int total;
  final int page;
  final int limit;

  OperatorsResponse({
    required this.operators,
    required this.total,
    required this.page,
    required this.limit,
  });

  factory OperatorsResponse.fromJson(Map<String, dynamic> json) => _$OperatorsResponseFromJson(json);
  Map<String, dynamic> toJson() => _$OperatorsResponseToJson(this);
}

/// Dados do cache de operadores
@JsonSerializable()
class OperatorsCache {
  final List<Operator> operators;
  final DateTime cachedAt;
  final String clientId;

  OperatorsCache({
    required this.operators,
    required this.cachedAt,
    required this.clientId,
  });

  factory OperatorsCache.fromJson(Map<String, dynamic> json) => _$OperatorsCacheFromJson(json);
  Map<String, dynamic> toJson() => _$OperatorsCacheToJson(this);

  /// Verificar se o cache ainda é válido (24 horas)
  bool get isValid {
    final now = DateTime.now();
    final difference = now.difference(cachedAt);
    return difference.inHours < 24;
  }

  /// Verificar se o cache é para o cliente correto
  bool isForClient(String clientId) => this.clientId == clientId;
}


