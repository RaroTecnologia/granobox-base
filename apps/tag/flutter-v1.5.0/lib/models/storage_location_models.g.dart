// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'storage_location_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

StorageLocation _$StorageLocationFromJson(Map<String, dynamic> json) =>
    StorageLocation(
      id: json['id'] as String,
      nome: json['nome'] as String,
      tipo: $enumDecode(_$StorageLocationTypeEnumMap, json['tipo']),
      descricao: json['descricao'] as String?,
      temperatura: _doubleFromJson(json['temperatura']),
      capacidade: _intFromJson(json['capacidade']),
      setor: json['setor'] as String?,
      ativo: json['ativo'] as bool,
      clientId: json['clientId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$StorageLocationToJson(StorageLocation instance) =>
    <String, dynamic>{
      'id': instance.id,
      'nome': instance.nome,
      'tipo': _$StorageLocationTypeEnumMap[instance.tipo]!,
      'descricao': instance.descricao,
      'temperatura': instance.temperatura,
      'capacidade': instance.capacidade,
      'setor': instance.setor,
      'ativo': instance.ativo,
      'clientId': instance.clientId,
      'createdAt': instance.createdAt.toIso8601String(),
      'updatedAt': instance.updatedAt.toIso8601String(),
    };

const _$StorageLocationTypeEnumMap = {
  StorageLocationType.geladeira: 'geladeira',
  StorageLocationType.freezer: 'freezer',
  StorageLocationType.prateleira: 'prateleira',
  StorageLocationType.estoque: 'estoque',
  StorageLocationType.balcao: 'balcao',
  StorageLocationType.outro: 'outro',
};

CreateStorageLocationRequest _$CreateStorageLocationRequestFromJson(
  Map<String, dynamic> json,
) => CreateStorageLocationRequest(
  nome: json['nome'] as String,
  tipo: $enumDecode(_$StorageLocationTypeEnumMap, json['tipo']),
  descricao: json['descricao'] as String?,
  temperatura: _doubleFromJson(json['temperatura']),
  capacidade: _intFromJson(json['capacidade']),
  setor: json['setor'] as String?,
  ativo: json['ativo'] as bool?,
);

Map<String, dynamic> _$CreateStorageLocationRequestToJson(
  CreateStorageLocationRequest instance,
) => <String, dynamic>{
  'nome': instance.nome,
  'tipo': _$StorageLocationTypeEnumMap[instance.tipo]!,
  'descricao': instance.descricao,
  'temperatura': instance.temperatura,
  'capacidade': instance.capacidade,
  'setor': instance.setor,
  'ativo': instance.ativo,
};

UpdateStorageLocationRequest _$UpdateStorageLocationRequestFromJson(
  Map<String, dynamic> json,
) => UpdateStorageLocationRequest(
  nome: json['nome'] as String,
  tipo: $enumDecode(_$StorageLocationTypeEnumMap, json['tipo']),
  descricao: json['descricao'] as String?,
  temperatura: _doubleFromJson(json['temperatura']),
  capacidade: _intFromJson(json['capacidade']),
  setor: json['setor'] as String?,
  ativo: json['ativo'] as bool?,
);

Map<String, dynamic> _$UpdateStorageLocationRequestToJson(
  UpdateStorageLocationRequest instance,
) => <String, dynamic>{
  'nome': instance.nome,
  'tipo': _$StorageLocationTypeEnumMap[instance.tipo]!,
  'descricao': instance.descricao,
  'temperatura': instance.temperatura,
  'capacidade': instance.capacidade,
  'setor': instance.setor,
  'ativo': instance.ativo,
};
