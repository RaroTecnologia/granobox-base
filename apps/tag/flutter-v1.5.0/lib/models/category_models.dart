import 'package:json_annotation/json_annotation.dart';

part 'category_models.g.dart';

@JsonSerializable()
class Category {
  final String id;
  final String name;
  final String clientId;
  final String? parentId;
  final String? defaultTemplateId;
  final String? defaultPrinterId; // ⭐ NOVO
  final String? icon; // ⭐ NOVO: Nome do ícone (ex: "wine", "hamburger", "bread")
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;
  final CategoryParent? parent;
  final List<CategoryProduct>? products;

  Category({
    required this.id,
    required this.name,
    required this.clientId,
    this.parentId,
    this.defaultTemplateId,
    this.defaultPrinterId, // ⭐ NOVO
    this.icon, // ⭐ NOVO
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
    this.parent,
    this.products,
  });

  factory Category.fromJson(Map<String, dynamic> json) => _$CategoryFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryToJson(this);
}

@JsonSerializable()
class CategoryParent {
  final String id;
  final String name;
  final String? defaultPrinterId;

  CategoryParent({
    required this.id,
    required this.name,
    this.defaultPrinterId,
  });

  factory CategoryParent.fromJson(Map<String, dynamic> json) => _$CategoryParentFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryParentToJson(this);
}

@JsonSerializable()
class CategoryProduct {
  final String id;
  final String name;
  final String? defaultPrinterId;

  CategoryProduct({
    required this.id,
    required this.name,
    this.defaultPrinterId,
  });

  factory CategoryProduct.fromJson(Map<String, dynamic> json) => _$CategoryProductFromJson(json);
  Map<String, dynamic> toJson() => _$CategoryProductToJson(this);
}

@JsonSerializable()
class CreateCategoryRequest {
  final String name;
  final String clientId;
  final String? parentId;
  final String? defaultTemplateId;
  final String? defaultPrinterId; // ⭐ NOVO
  final String? icon; // ⭐ NOVO
  final bool isActive;

  CreateCategoryRequest({
    required this.name,
    required this.clientId,
    this.parentId,
    this.defaultTemplateId,
    this.defaultPrinterId, // ⭐ NOVO
    this.icon, // ⭐ NOVO
    this.isActive = true,
  });

  factory CreateCategoryRequest.fromJson(Map<String, dynamic> json) => _$CreateCategoryRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateCategoryRequestToJson(this);
}

@JsonSerializable()
class UpdateCategoryRequest {
  final String name;
  final String? parentId;
  final String? defaultTemplateId;
  final String? defaultPrinterId; // ⭐ NOVO
  final String? icon; // ⭐ NOVO
  final bool isActive;

  UpdateCategoryRequest({
    required this.name,
    this.parentId,
    this.defaultTemplateId,
    this.defaultPrinterId, // ⭐ NOVO
    this.icon, // ⭐ NOVO
    required this.isActive,
  });

  factory UpdateCategoryRequest.fromJson(Map<String, dynamic> json) => _$UpdateCategoryRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateCategoryRequestToJson(this);
}



