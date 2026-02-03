import 'package:json_annotation/json_annotation.dart';

part 'label_history_models.g.dart';

@JsonSerializable()
class LabelHistoryEvent {
  final String id;
  final String labelId;
  final String type;
  final String? userId;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  LabelHistoryEvent({
    required this.id,
    required this.labelId,
    required this.type,
    this.userId,
    this.metadata,
    required this.createdAt,
  });

  factory LabelHistoryEvent.fromJson(Map<String, dynamic> json) => _$LabelHistoryEventFromJson(json);
  Map<String, dynamic> toJson() => _$LabelHistoryEventToJson(this);

  /// Traduzir tipo de evento para português
  String get tipoTraduzido {
    switch (type) {
      case 'created':
        return 'Criada';
      case 'printed':
        return 'Impressa';
      case 'used':
      case 'consumed':
        return 'Baixada';
      case 'updated':
        return 'Atualizada';
      case 'archived':
        return 'Arquivada';
      case 'viewed':
        return 'Visualizada';
      default:
        return type;
    }
  }

  /// Mapear tipo para categoria visual
  String get tipoVisual {
    switch (type) {
      case 'created':
        return 'criacao';
      case 'printed':
        return 'impressao';
      case 'used':
      case 'consumed':
        return 'baixada'; // ⭐ Verde para baixadas
      case 'updated':
        return 'alteracao';
      case 'archived':
        return 'arquivamento';
      case 'viewed':
        return 'consulta';
      default:
        return 'consulta';
    }
  }

  /// Verificar se tem metadata útil para exibir
  bool get hasUsefulMetadata {
    if (metadata == null || metadata!.isEmpty) return false;
    return metadata!.keys.any((key) {
      if (key == 'code') return false;
      final value = metadata![key];
      return value != null && value != '';
    });
  }
}






