// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'category_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

Category _$CategoryFromJson(Map<String, dynamic> json) => Category(
  id: json['id'] as String,
  name: json['name'] as String,
  clientId: json['clientId'] as String,
  parentId: json['parentId'] as String?,
  defaultTemplateId: json['defaultTemplateId'] as String?,
  defaultPrinterId: json['defaultPrinterId'] as String?,
  icon: json['icon'] as String?,
  isActive: json['isActive'] as bool,
  createdAt: DateTime.parse(json['createdAt'] as String),
  updatedAt: DateTime.parse(json['updatedAt'] as String),
  parent: json['parent'] == null
      ? null
      : CategoryParent.fromJson(json['parent'] as Map<String, dynamic>),
  products: (json['products'] as List<dynamic>?)
      ?.map((e) => CategoryProduct.fromJson(e as Map<String, dynamic>))
      .toList(),
);

Map<String, dynamic> _$CategoryToJson(Category instance) => <String, dynamic>{
  'id': instance.id,
  'name': instance.name,
  'clientId': instance.clientId,
  'parentId': instance.parentId,
  'defaultTemplateId': instance.defaultTemplateId,
  'defaultPrinterId': instance.defaultPrinterId,
  'icon': instance.icon,
  'isActive': instance.isActive,
  'createdAt': instance.createdAt.toIso8601String(),
  'updatedAt': instance.updatedAt.toIso8601String(),
  'parent': instance.parent,
  'products': instance.products,
};

CategoryParent _$CategoryParentFromJson(Map<String, dynamic> json) =>
    CategoryParent(
      id: json['id'] as String,
      name: json['name'] as String,
      defaultPrinterId: json['defaultPrinterId'] as String?,
    );

Map<String, dynamic> _$CategoryParentToJson(CategoryParent instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'defaultPrinterId': instance.defaultPrinterId,
    };

CategoryProduct _$CategoryProductFromJson(Map<String, dynamic> json) =>
    CategoryProduct(
      id: json['id'] as String,
      name: json['name'] as String,
      defaultPrinterId: json['defaultPrinterId'] as String?,
    );

Map<String, dynamic> _$CategoryProductToJson(CategoryProduct instance) =>
    <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'defaultPrinterId': instance.defaultPrinterId,
    };

CreateCategoryRequest _$CreateCategoryRequestFromJson(
  Map<String, dynamic> json,
) => CreateCategoryRequest(
  name: json['name'] as String,
  clientId: json['clientId'] as String,
  parentId: json['parentId'] as String?,
  defaultTemplateId: json['defaultTemplateId'] as String?,
  defaultPrinterId: json['defaultPrinterId'] as String?,
  icon: json['icon'] as String?,
  isActive: json['isActive'] as bool? ?? true,
);

Map<String, dynamic> _$CreateCategoryRequestToJson(
  CreateCategoryRequest instance,
) => <String, dynamic>{
  'name': instance.name,
  'clientId': instance.clientId,
  'parentId': instance.parentId,
  'defaultTemplateId': instance.defaultTemplateId,
  'defaultPrinterId': instance.defaultPrinterId,
  'icon': instance.icon,
  'isActive': instance.isActive,
};

UpdateCategoryRequest _$UpdateCategoryRequestFromJson(
  Map<String, dynamic> json,
) => UpdateCategoryRequest(
  name: json['name'] as String,
  parentId: json['parentId'] as String?,
  defaultTemplateId: json['defaultTemplateId'] as String?,
  defaultPrinterId: json['defaultPrinterId'] as String?,
  icon: json['icon'] as String?,
  isActive: json['isActive'] as bool,
);

Map<String, dynamic> _$UpdateCategoryRequestToJson(
  UpdateCategoryRequest instance,
) => <String, dynamic>{
  'name': instance.name,
  'parentId': instance.parentId,
  'defaultTemplateId': instance.defaultTemplateId,
  'defaultPrinterId': instance.defaultPrinterId,
  'icon': instance.icon,
  'isActive': instance.isActive,
};
