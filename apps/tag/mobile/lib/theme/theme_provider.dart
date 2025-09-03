import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app_theme.dart';

enum AppThemeMode { light, dark }

class ThemeProvider extends ChangeNotifier {
  AppThemeMode _themeMode = AppThemeMode.dark;
  
  AppThemeMode get themeMode => _themeMode;
  ThemeData get theme => _themeMode == AppThemeMode.dark 
      ? AppTheme.darkTheme 
      : AppTheme.lightTheme;
  
  bool get isDark => _themeMode == AppThemeMode.dark;
  
  ThemeProvider() {
    _loadTheme();
  }
  
  Future<void> _loadTheme() async {
    final prefs = await SharedPreferences.getInstance();
    final themeIndex = prefs.getInt('theme_mode') ?? 1; // 0 = light, 1 = dark
    _themeMode = AppThemeMode.values[themeIndex];
    notifyListeners();
  }
  
  Future<void> setTheme(AppThemeMode mode) async {
    if (_themeMode != mode) {
      _themeMode = mode;
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('theme_mode', mode.index);
      notifyListeners();
    }
  }
  
  Future<void> toggleTheme() async {
    final newMode = _themeMode == AppThemeMode.dark 
        ? AppThemeMode.light 
        : AppThemeMode.dark;
    await setTheme(newMode);
  }
}

