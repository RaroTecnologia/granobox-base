import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

class SystemUiHelper {
  SystemUiHelper._();

  static Future<void> setSystemUiOverlayStyle(SystemUiOverlayStyle style) async {
    if (kIsWeb || defaultTargetPlatform != TargetPlatform.android) {
      SystemChrome.setSystemUIOverlayStyle(style);
      return;
    }

    const platform = MethodChannel('com.wdezoito.granoboxtag/system_ui');
    try {
      await platform.invokeMethod<void>('configureSystemBars', {
        'lightIcons': style.statusBarIconBrightness == Brightness.light,
        'showStatus': style.statusBarColor == null,
      });
    } on MissingPluginException {
      SystemChrome.setSystemUIOverlayStyle(style);
    } on PlatformException {
      SystemChrome.setSystemUIOverlayStyle(style);
    }
  }
}
