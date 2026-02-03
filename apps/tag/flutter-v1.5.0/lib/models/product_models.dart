import 'package:json_annotation/json_annotation.dart';

part 'product_models.g.dart';

// Conversores customizados para parsing seguro de números
class SafeDoubleConverter implements JsonConverter<double?, dynamic> {
  const SafeDoubleConverter();

  @override
  double? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is num) return json.toDouble();
    if (json is String) return double.tryParse(json);
    return null;
  }

  @override
  dynamic toJson(double? object) => object;
}

class SafeIntConverter implements JsonConverter<int?, dynamic> {
  const SafeIntConverter();

  @override
  int? fromJson(dynamic json) {
    if (json == null) return null;
    if (json is num) return json.toInt();
    if (json is String) return int.tryParse(json);
    return null;
  }

  @override
  dynamic toJson(int? object) => object;
}

@JsonSerializable()
class Product {
  final String id;
  final String name;
  final String? code;
  final String clientId;
  final String categoryId;
  final String type; // 'raw_material', 'finished', 'manipulated'
  final String? brand;
  final String? sif;
  final String? description;
  final bool? showBrandOnLabel;
  final bool? showSifOnLabel;
  final bool? showManufacturingBatchOnLabel;
  final bool? showExpiryDateOnLabel;
  final String? weightUnit;
  final String? weight;
  final String? quantity;
  final String? defaultStorageLocationId;
  final String? customTemplateId;
  final String? defaultPrinterId; // ⭐ NOVO
  @SafeIntConverter()
  final int? shelfLifeAmbient;
  @SafeIntConverter()
  final int? shelfLifeRefrigerated;
  @SafeIntConverter()
  final int? shelfLifeFrozen;
  final String? barcode;
  final bool isActive;
  final bool? isLabelOnly; // ⭐ NOVO: Quando true, impressão é só rótulo (sem código/rastreabilidade)
  final bool? showTimeOnLabel; // ⭐ NOVO: Quando true, exibe hora na manipulação e validade
  final DateTime createdAt;
  final DateTime updatedAt;

  Product({
    required this.id,
    required this.name,
    this.code,
    required this.clientId,
    required this.categoryId,
    required this.type,
    this.brand,
    this.sif,
    this.description,
    this.showBrandOnLabel,
    this.showSifOnLabel,
    this.showManufacturingBatchOnLabel,
    this.showExpiryDateOnLabel,
    this.weightUnit,
    this.weight,
    this.quantity,
    this.defaultStorageLocationId,
    this.customTemplateId,
    this.defaultPrinterId, // ⭐ NOVO
    this.shelfLifeAmbient,
    this.shelfLifeRefrigerated,
    this.shelfLifeFrozen,
    this.barcode,
    required this.isActive,
    this.isLabelOnly, // ⭐ NOVO
    this.showTimeOnLabel, // ⭐ NOVO
    required this.createdAt,
    required this.updatedAt,
  });

  factory Product.fromJson(Map<String, dynamic> json) => _$ProductFromJson(json);
  Map<String, dynamic> toJson() => _$ProductToJson(this);
}

@JsonSerializable()
class CreateProductRequest {
  final String name;
  final String? code;
  final String clientId;
  final String categoryId;
  final String type;
  final String? brand;
  final String? sif;
  final bool? showBrandOnLabel;
  final bool? showSifOnLabel;
  final bool? showManufacturingBatchOnLabel;
  final bool? showExpiryDateOnLabel;
  final String? weightUnit;
  final String? weight;
  final String? quantity;
  final String? defaultStorageLocationId;
  final String? customTemplateId;
  final String? defaultPrinterId; // ⭐ NOVO
  final String? currency;
  @SafeIntConverter()
  final int? shelfLifeAmbient;
  @SafeIntConverter()
  final int? shelfLifeRefrigerated;
  @SafeIntConverter()
  final int? shelfLifeFrozen;
  final String? observations;
  final String? barcode;
  final bool? isActive;
  final bool? isLabelOnly; // ⭐ NOVO: Quando true, impressão é só rótulo (sem código/rastreabilidade)
  final bool? showTimeOnLabel; // ⭐ NOVO: Quando true, exibe hora na manipulação e validade

  CreateProductRequest({
    required this.name,
    this.code,
    required this.clientId,
    required this.categoryId,
    required this.type,
    this.brand,
    this.sif,
    this.showBrandOnLabel,
    this.showSifOnLabel,
    this.showManufacturingBatchOnLabel,
    this.showExpiryDateOnLabel,
    this.weightUnit,
    this.weight,
    this.quantity,
    this.defaultStorageLocationId,
    this.customTemplateId,
    this.defaultPrinterId, // ⭐ NOVO
    this.currency,
    this.shelfLifeAmbient,
    this.shelfLifeRefrigerated,
    this.shelfLifeFrozen,
    this.observations,
    this.barcode,
    this.isActive,
    this.isLabelOnly, // ⭐ NOVO
    this.showTimeOnLabel, // ⭐ NOVO
  });

  factory CreateProductRequest.fromJson(Map<String, dynamic> json) => _$CreateProductRequestFromJson(json);
  Map<String, dynamic> toJson() => _$CreateProductRequestToJson(this);
}

@JsonSerializable()
class UpdateProductRequest {
  final String name;
  final String? code;
  final String categoryId;
  final String type;
  final String? brand;
  final String? sif;
  final bool? showBrandOnLabel;
  final bool? showSifOnLabel;
  final bool? showManufacturingBatchOnLabel;
  final bool? showExpiryDateOnLabel;
  final String? weightUnit;
  final String? weight;
  final String? quantity;
  final String? defaultStorageLocationId;
  final String? customTemplateId;
  final String? defaultPrinterId; // ⭐ NOVO
  @SafeIntConverter()
  final int? shelfLifeAmbient;
  @SafeIntConverter()
  final int? shelfLifeRefrigerated;
  @SafeIntConverter()
  final int? shelfLifeFrozen;
  final String? observations;
  final String? barcode;
  final bool? isActive;
  final bool? isLabelOnly; // ⭐ NOVO: Quando true, impressão é só rótulo (sem código/rastreabilidade)
  final bool? showTimeOnLabel; // ⭐ NOVO: Quando true, exibe hora na manipulação e validade

  UpdateProductRequest({
    required this.name,
    this.code,
    required this.categoryId,
    required this.type,
    this.brand,
    this.sif,
    this.showBrandOnLabel,
    this.showSifOnLabel,
    this.showManufacturingBatchOnLabel,
    this.showExpiryDateOnLabel,
    this.weightUnit,
    this.weight,
    this.quantity,
    this.defaultStorageLocationId,
    this.customTemplateId,
    this.defaultPrinterId, // ⭐ NOVO
    this.shelfLifeAmbient,
    this.shelfLifeRefrigerated,
    this.shelfLifeFrozen,
    this.observations,
    this.barcode,
    this.isActive,
    this.isLabelOnly, // ⭐ NOVO
    this.showTimeOnLabel, // ⭐ NOVO
  });

  factory UpdateProductRequest.fromJson(Map<String, dynamic> json) => _$UpdateProductRequestFromJson(json);
  Map<String, dynamic> toJson() => _$UpdateProductRequestToJson(this);
}



