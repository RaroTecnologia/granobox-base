import 'package:json_annotation/json_annotation.dart';

part 'operation_models.g.dart';

@JsonSerializable()
class Operation {
  final String id;
  final String name;
  final String? description;
  final bool isActive;
  final String clientId;
  final String? agentFingerprint; // ⭐ NOVO: Fingerprint do Edge Agent
  final DateTime createdAt;
  final DateTime updatedAt;

  const Operation({
    required this.id,
    required this.name,
    this.description,
    required this.isActive,
    required this.clientId,
    this.agentFingerprint,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Operation.fromJson(Map<String, dynamic> json) => _$OperationFromJson(json);
  Map<String, dynamic> toJson() => _$OperationToJson(this);
}

@JsonSerializable()
class CreateOperationRequest {
  final String name;
  final String? description;
  final bool isActive;

  const CreateOperationRequest({
    required this.name,
    this.description,
    this.isActive = true,
  });

  factory CreateOperationRequest.fromJson(Map<String, dynamic> json) => _$CreateOperationRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateOperationRequestToJson(this);
}

@JsonSerializable()
class UpdateOperationRequest {
  final String? name;
  final String? description;
  final bool? isActive;

  const UpdateOperationRequest({
    this.name,
    this.description,
    this.isActive,
  });

  factory UpdateOperationRequest.fromJson(Map<String, dynamic> json) => _$UpdateOperationRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateOperationRequestToJson(this);
}


