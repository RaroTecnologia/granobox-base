import 'package:json_annotation/json_annotation.dart';

part 'storage_location_models.g.dart';

// Funções auxiliares para conversão de tipos
double? _doubleFromJson(dynamic value) {
  if (value == null) return null;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is String) return double.tryParse(value);
  return null;
}

int? _intFromJson(dynamic value) {
  if (value == null) return null;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value);
  return null;
}

enum StorageLocationType {
  @JsonValue('geladeira')
  geladeira,
  @JsonValue('freezer')
  freezer,
  @JsonValue('prateleira')
  prateleira,
  @JsonValue('estoque')
  estoque,
  @JsonValue('balcao')
  balcao,
  @JsonValue('outro')
  outro,
}

extension StorageLocationTypeExtension on StorageLocationType {
  String get displayName {
    switch (this) {
      case StorageLocationType.geladeira:
        return 'Geladeira';
      case StorageLocationType.freezer:
        return 'Freezer';
      case StorageLocationType.prateleira:
        return 'Prateleira';
      case StorageLocationType.estoque:
        return 'Estoque';
      case StorageLocationType.balcao:
        return 'Balcão';
      case StorageLocationType.outro:
        return 'Outro';
    }
  }
  
  String get value {
    switch (this) {
      case StorageLocationType.geladeira:
        return 'geladeira';
      case StorageLocationType.freezer:
        return 'freezer';
      case StorageLocationType.prateleira:
        return 'prateleira';
      case StorageLocationType.estoque:
        return 'estoque';
      case StorageLocationType.balcao:
        return 'balcao';
      case StorageLocationType.outro:
        return 'outro';
    }
  }
}

@JsonSerializable()
class StorageLocation {
  final String id;
  final String nome;
  final StorageLocationType tipo;
  final String? descricao;
  @JsonKey(fromJson: _doubleFromJson)
  final double? temperatura;
  @JsonKey(fromJson: _intFromJson)
  final int? capacidade;
  final String? setor;
  final bool ativo;
  final String clientId;
  final DateTime createdAt;
  final DateTime updatedAt;

  StorageLocation({
    required this.id,
    required this.nome,
    required this.tipo,
    this.descricao,
    this.temperatura,
    this.capacidade,
    this.setor,
    required this.ativo,
    required this.clientId,
    required this.createdAt,
    required this.updatedAt,
  });

  factory StorageLocation.fromJson(Map<String, dynamic> json) => _$StorageLocationFromJson(json);
  Map<String, dynamic> toJson() => _$StorageLocationToJson(this);

  String get displayName {
    return '$nome (${tipo.displayName})';
  }
}

@JsonSerializable()
class CreateStorageLocationRequest {
  final String nome;
  final StorageLocationType tipo;
  final String? descricao;
  @JsonKey(fromJson: _doubleFromJson)
  final double? temperatura;
  @JsonKey(fromJson: _intFromJson)
  final int? capacidade;
  final String? setor;
  final bool? ativo;

  CreateStorageLocationRequest({
    required this.nome,
    required this.tipo,
    this.descricao,
    this.temperatura,
    this.capacidade,
    this.setor,
    this.ativo,
  });

  factory CreateStorageLocationRequest.fromJson(Map<String, dynamic> json) => _$CreateStorageLocationRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateStorageLocationRequestToJson(this);
}

@JsonSerializable()
class UpdateStorageLocationRequest {
  final String nome;
  final StorageLocationType tipo;
  final String? descricao;
  @JsonKey(fromJson: _doubleFromJson)
  final double? temperatura;
  @JsonKey(fromJson: _intFromJson)
  final int? capacidade;
  final String? setor;
  final bool? ativo;

  UpdateStorageLocationRequest({
    required this.nome,
    required this.tipo,
    this.descricao,
    this.temperatura,
    this.capacidade,
    this.setor,
    this.ativo,
  });

  factory UpdateStorageLocationRequest.fromJson(Map<String, dynamic> json) => _$UpdateStorageLocationRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateStorageLocationRequestToJson(this);
}