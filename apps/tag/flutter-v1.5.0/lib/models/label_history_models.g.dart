// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'label_history_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

LabelHistoryEvent _$LabelHistoryEventFromJson(Map<String, dynamic> json) =>
    LabelHistoryEvent(
      id: json['id'] as String,
      labelId: json['labelId'] as String,
      type: json['type'] as String,
      userId: json['userId'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$LabelHistoryEventToJson(LabelHistoryEvent instance) =>
    <String, dynamic>{
      'id': instance.id,
      'labelId': instance.labelId,
      'type': instance.type,
      'userId': instance.userId,
      'metadata': instance.metadata,
      'createdAt': instance.createdAt.toIso8601String(),
    };
