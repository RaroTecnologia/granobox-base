import 'package:json_annotation/json_annotation.dart';

part 'date_config_models.g.dart';

@JsonSerializable()
class DateConfig {
  final bool showTimeInDates;
  final String dateFormat;

  const DateConfig({
    required this.showTimeInDates,
    required this.dateFormat,
  });

  factory DateConfig.fromJson(Map<String, dynamic> json) => _$DateConfigFromJson(json);
  Map<String, dynamic> toJson() => _$DateConfigToJson(this);

  DateConfig copyWith({
    bool? showTimeInDates,
    String? dateFormat,
  }) {
    return DateConfig(
      showTimeInDates: showTimeInDates ?? this.showTimeInDates,
      dateFormat: dateFormat ?? this.dateFormat,
    );
  }
}

@JsonSerializable()
class UpdateDateConfigRequest {
  final bool? showTimeInDates;
  final String? dateFormat;

  const UpdateDateConfigRequest({
    this.showTimeInDates,
    this.dateFormat,
  });

  factory UpdateDateConfigRequest.fromJson(Map<String, dynamic> json) => _$UpdateDateConfigRequestFromJson(json);
  Map<String, dynamic> toJson() {
    final map = _$UpdateDateConfigRequestToJson(this);
    map.removeWhere((key, value) => value == null);
    return map;
  }
}
