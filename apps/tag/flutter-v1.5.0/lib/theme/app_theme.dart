import 'package:flutter/material.dart';

class AppTheme {
  // Cores do Granobox Tag
  static const Color primary = Color(0xFF1DA154); // Verde
  static const Color primaryDark = Color(0xFF1A8A4A); // Verde escuro
  static const Color primaryLight = Color(0xFF2DBB6B); // Verde claro
  
  // Cores do tema escuro
  static const Color dark900 = Color(0xFF0F0F0F);
  static const Color dark800 = Color(0xFF1A1A1A);
  static const Color dark700 = Color(0xFF2D2D2D);
  static const Color dark600 = Color(0xFF404040);
  static const Color dark500 = Color(0xFF555555);
  static const Color dark400 = Color(0xFF6B6B6B);
  static const Color dark300 = Color(0xFF808080);
  static const Color dark200 = Color(0xFF959595);
  static const Color dark100 = Color(0xFFAAAAAA);
  
  // Cores do tema claro
  static const Color light50 = Color(0xFFFAFAFA);
  static const Color light100 = Color(0xFFF5F5F5);
  static const Color light200 = Color(0xFFEEEEEE);
  static const Color light300 = Color(0xFFE0E0E0);
  static const Color light400 = Color(0xFFBDBDBD);
  static const Color light500 = Color(0xFF9E9E9E);
  static const Color light600 = Color(0xFF757575);
  static const Color light700 = Color(0xFF616161);
  static const Color light800 = Color(0xFF424242);
  static const Color light900 = Color(0xFF212121);

  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Manrope',
      brightness: Brightness.dark,
      colorScheme: const ColorScheme.dark(
        primary: primary,
        surface: dark800,
        onSurface: Colors.white,
        error: Colors.red,
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: dark900,
      appBarTheme: const AppBarTheme(
        backgroundColor: dark800,
        foregroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: const CardThemeData(
        color: dark800,
        elevation: 4,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: dark700,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide.none,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: const BorderSide(color: Colors.red, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        labelStyle: const TextStyle(color: dark300),
        hintStyle: const TextStyle(color: dark400),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
        ),
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
        headlineMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        titleLarge: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        titleMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: Colors.white,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: Colors.white,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: Colors.white,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          color: dark300,
        ),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      fontFamily: 'Manrope',
      brightness: Brightness.light,
      colorScheme: const ColorScheme.light(
        primary: primary,
        surface: Colors.white,
        onSurface: dark900,
        error: Colors.red,
        onError: Colors.white,
      ),
      scaffoldBackgroundColor: light50,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: dark900,
        elevation: 0,
        centerTitle: true,
      ),
      cardTheme: const CardThemeData(
        color: Colors.white,
        elevation: 2,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.all(Radius.circular(16)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: const BorderSide(color: light200, width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: const BorderSide(color: light200, width: 2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: const BorderSide(color: primary, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: const BorderSide(color: Colors.red, width: 2),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        labelStyle: const TextStyle(color: dark700),
        hintStyle: const TextStyle(color: light500),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(25),
          ),
        ),
      ),
      textTheme: const TextTheme(
        headlineLarge: TextStyle(
          fontSize: 32,
          fontWeight: FontWeight.bold,
          color: dark900,
        ),
        headlineMedium: TextStyle(
          fontSize: 28,
          fontWeight: FontWeight.w600,
          color: dark900,
        ),
        titleLarge: TextStyle(
          fontSize: 24,
          fontWeight: FontWeight.w600,
          color: dark900,
        ),
        titleMedium: TextStyle(
          fontSize: 20,
          fontWeight: FontWeight.w600,
          color: dark900,
        ),
        bodyLarge: TextStyle(
          fontSize: 16,
          color: dark900,
        ),
        bodyMedium: TextStyle(
          fontSize: 14,
          color: dark900,
        ),
        bodySmall: TextStyle(
          fontSize: 12,
          color: light600,
        ),
      ),
    );
  }
}
