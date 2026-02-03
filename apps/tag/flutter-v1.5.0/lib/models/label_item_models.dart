import 'package:json_annotation/json_annotation.dart';

part 'label_item_models.g.dart';

@JsonSerializable()
class LabelItem {
  final String id;
  final String clientId;
  final String labelTemplateId;
  final String name;
  final String? code;
  final Map<String, dynamic> data;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  LabelItem({
    required this.id,
    required this.clientId,
    required this.labelTemplateId,
    required this.name,
    this.code,
    required this.data,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LabelItem.fromJson(Map<String, dynamic> json) => _$LabelItemFromJson(json);
  Map<String, dynamic> toJson() => _$LabelItemToJson(this);

  LabelItem copyWith({
    String? id,
    String? clientId,
    String? labelTemplateId,
    String? name,
    String? code,
    Map<String, dynamic>? data,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return LabelItem(
      id: id ?? this.id,
      clientId: clientId ?? this.clientId,
      labelTemplateId: labelTemplateId ?? this.labelTemplateId,
      name: name ?? this.name,
      code: code ?? this.code,
      data: data ?? this.data,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

@JsonSerializable()
class CreateLabelItemDto {
  final String clientId;
  final String labelTemplateId;
  final String name;
  final String? code;
  final Map<String, dynamic>? data;
  final bool? isActive;

  CreateLabelItemDto({
    required this.clientId,
    required this.labelTemplateId,
    required this.name,
    this.code,
    this.data,
    this.isActive,
  });

  factory CreateLabelItemDto.fromJson(Map<String, dynamic> json) => 
      _$CreateLabelItemDtoFromJson(json);
  Map<String, dynamic> toJson() => _$CreateLabelItemDtoToJson(this);
}

@JsonSerializable()
class UpdateLabelItemDto {
  final String? clientId;
  final String? labelTemplateId;
  final String? name;
  final String? code;
  final Map<String, dynamic>? data;
  final bool? isActive;

  UpdateLabelItemDto({
    this.clientId,
    this.labelTemplateId,
    this.name,
    this.code,
    this.data,
    this.isActive,
  });

  factory UpdateLabelItemDto.fromJson(Map<String, dynamic> json) => 
      _$UpdateLabelItemDtoFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateLabelItemDtoToJson(this);
}

