import 'package:json_annotation/json_annotation.dart';

part 'tagment_printer_config_models.g.dart';

@JsonSerializable()
class TagmentPrinterConfig {
  final String? tagmentPrinterValidadeId;
  final String? tagmentPrinterRotuloId;

  const TagmentPrinterConfig({
    this.tagmentPrinterValidadeId,
    this.tagmentPrinterRotuloId,
  });

  factory TagmentPrinterConfig.fromJson(Map<String, dynamic> json) =>
      _$TagmentPrinterConfigFromJson(json);

  Map<String, dynamic> toJson() => _$TagmentPrinterConfigToJson(this);

  TagmentPrinterConfig copyWith({
    String? tagmentPrinterValidadeId,
    String? tagmentPrinterRotuloId,
  }) {
    return TagmentPrinterConfig(
      tagmentPrinterValidadeId: tagmentPrinterValidadeId ?? this.tagmentPrinterValidadeId,
      tagmentPrinterRotuloId: tagmentPrinterRotuloId ?? this.tagmentPrinterRotuloId,
    );
  }

  /// Verificar se tem impressora de validade configurada
  bool get hasValidadePrinter => tagmentPrinterValidadeId != null && tagmentPrinterValidadeId!.isNotEmpty;

  /// Verificar se tem impressora de rótulo configurada
  bool get hasRotuloPrinter => tagmentPrinterRotuloId != null && tagmentPrinterRotuloId!.isNotEmpty;

  /// Verificar se tem alguma impressora configurada
  bool get hasAnyPrinter => hasValidadePrinter || hasRotuloPrinter;

  @override
  String toString() {
    return 'TagmentPrinterConfig(tagmentPrinterValidadeId: $tagmentPrinterValidadeId, tagmentPrinterRotuloId: $tagmentPrinterRotuloId)';
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is TagmentPrinterConfig &&
        other.tagmentPrinterValidadeId == tagmentPrinterValidadeId &&
        other.tagmentPrinterRotuloId == tagmentPrinterRotuloId;
  }

  @override
  int get hashCode {
    return tagmentPrinterValidadeId.hashCode ^ tagmentPrinterRotuloId.hashCode;
  }
}

@JsonSerializable()
class UpdateTagmentPrinterConfigRequest {
  final String? tagmentPrinterValidadeId;
  final String? tagmentPrinterRotuloId;

  const UpdateTagmentPrinterConfigRequest({
    this.tagmentPrinterValidadeId,
    this.tagmentPrinterRotuloId,
  });

  factory UpdateTagmentPrinterConfigRequest.fromJson(Map<String, dynamic> json) =>
      _$UpdateTagmentPrinterConfigRequestFromJson(json);

  Map<String, dynamic> toJson() => _$UpdateTagmentPrinterConfigRequestToJson(this);

  @override
  String toString() {
    return 'UpdateTagmentPrinterConfigRequest(tagmentPrinterValidadeId: $tagmentPrinterValidadeId, tagmentPrinterRotuloId: $tagmentPrinterRotuloId)';
  }
}


