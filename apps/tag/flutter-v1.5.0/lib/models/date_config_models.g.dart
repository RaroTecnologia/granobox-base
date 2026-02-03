// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'date_config_models.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DateConfig _$DateConfigFromJson(Map<String, dynamic> json) => DateConfig(
  showTimeInDates: json['showTimeInDates'] as bool,
  dateFormat: json['dateFormat'] as String,
);

Map<String, dynamic> _$DateConfigToJson(DateConfig instance) =>
    <String, dynamic>{
      'showTimeInDates': instance.showTimeInDates,
      'dateFormat': instance.dateFormat,
    };

UpdateDateConfigRequest _$UpdateDateConfigRequestFromJson(
  Map<String, dynamic> json,
) => UpdateDateConfigRequest(
  showTimeInDates: json['showTimeInDates'] as bool?,
  dateFormat: json['dateFormat'] as String?,
);

Map<String, dynamic> _$UpdateDateConfigRequestToJson(
  UpdateDateConfigRequest instance,
) => <String, dynamic>{
  'showTimeInDates': instance.showTimeInDates,
  'dateFormat': instance.dateFormat,
};
