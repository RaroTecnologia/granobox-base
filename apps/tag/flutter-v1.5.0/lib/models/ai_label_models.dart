/// Modelo para dados de etiqueta gerada por IA
class AiLabelData {
  String? productName;
  String? brand;
  String? sif;
  String? dataValidade;
  String? observations;
  String? barcode;
  String? weight;
  String? weightUnit;
  String? storageInstructions;
  int? shelfLifeAmbientDays;
  int? shelfLifeRefrigeratedDays;
  int? shelfLifeFrozenDays;
  
  AiLabelData({
    this.productName,
    this.brand,
    this.sif,
    this.dataValidade,
    this.observations,
    this.barcode,
    this.weight,
    this.weightUnit,
    this.storageInstructions,
    this.shelfLifeAmbientDays,
    this.shelfLifeRefrigeratedDays,
    this.shelfLifeFrozenDays,
  });
  
  factory AiLabelData.fromJson(Map<String, dynamic> json) {
    int? _parseInt(dynamic value) {
      if (value == null) return null;
      if (value is int) return value;
      if (value is double) return value.round();
      if (value is String) {
        final digits = RegExp(r'\d+').stringMatch(value);
        return digits != null ? int.tryParse(digits) : null;
      }
      return null;
    }
    
    final shelfLife = json['shelf_life_days'] as Map<String, dynamic>?;
    
    return AiLabelData(
      productName: json['product_name'] as String?,
      brand: json['brand'] as String?,
      sif: json['sif'] as String?,
      dataValidade: json['data_validade'] as String?,
      observations: json['observations'] as String?,
      barcode: json['barcode'] as String?,
      weight: json['weight']?.toString(),
      weightUnit: json['weight_unit'] as String?,
      storageInstructions: json['storage_instructions'] as String?,
      shelfLifeAmbientDays: shelfLife != null ? _parseInt(shelfLife['ambient']) : _parseInt(json['shelf_life_ambient']),
      shelfLifeRefrigeratedDays: shelfLife != null ? _parseInt(shelfLife['refrigerated']) : _parseInt(json['shelf_life_refrigerated']),
      shelfLifeFrozenDays: shelfLife != null ? _parseInt(shelfLife['frozen']) : _parseInt(json['shelf_life_frozen']),
    );
  }
  
  Map<String, dynamic> toJson() {
    return {
      'product_name': productName,
      'brand': brand,
      'sif': sif,
      'data_validade': dataValidade,
      'observations': observations,
      'barcode': barcode,
      'weight': weight,
      'weight_unit': weightUnit,
      'storage_instructions': storageInstructions,
      'shelf_life_days': {
        'ambient': shelfLifeAmbientDays,
        'refrigerated': shelfLifeRefrigeratedDays,
        'frozen': shelfLifeFrozenDays,
      },
    };
  }
  
  bool get isEmpty {
    return productName == null &&
        brand == null &&
        sif == null &&
        dataValidade == null &&
        barcode == null &&
        weight == null &&
        storageInstructions == null;
  }
  
  bool get isValid {
    return productName != null && productName!.isNotEmpty;
  }
}

/// Resposta da API OpenAI
class OpenAiResponse {
  final bool success;
  final AiLabelData? data;
  final dynamic customData; // Para dados customizados
  final String? error;
  
  OpenAiResponse({
    required this.success,
    this.data,
    this.customData,
    this.error,
  });
  
  factory OpenAiResponse.success(AiLabelData data) {
    return OpenAiResponse(
      success: true,
      data: data,
    );
  }
  
  factory OpenAiResponse.successCustom(dynamic customData) {
    return OpenAiResponse(
      success: true,
      customData: customData,
    );
  }
  
  factory OpenAiResponse.error(String error) {
    return OpenAiResponse(
      success: false,
      error: error,
    );
  }
}

