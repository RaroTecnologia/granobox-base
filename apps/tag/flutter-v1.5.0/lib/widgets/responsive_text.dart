import 'package:flutter/material.dart';
import '../utils/responsive.dart';

class ResponsiveText extends StatelessWidget {
  final String text;
  final double fontSize;
  final FontWeight? fontWeight;
  final Color? color;
  final TextAlign? textAlign;
  final int? maxLines;
  final TextOverflow? overflow;
  final double? height;
  final String? fontFamily;

  const ResponsiveText(
    this.text, {
    Key? key,
    this.fontSize = 14,
    this.fontWeight,
    this.color,
    this.textAlign,
    this.maxLines,
    this.overflow,
    this.height,
    this.fontFamily,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: TextStyle(
        fontSize: ResponsiveUtils.getResponsiveFontSize(context, fontSize),
        fontWeight: fontWeight,
        color: color,
        height: height,
        fontFamily: fontFamily,
      ),
      textAlign: textAlign,
      maxLines: maxLines,
      overflow: overflow,
    );
  }
}

class ResponsiveTextStyle {
  static TextStyle title(BuildContext context) {
    return TextStyle(
      fontSize: ResponsiveUtils.getResponsiveFontSize(context, 24),
      fontWeight: FontWeight.bold,
      color: Colors.white,
    );
  }
  
  static TextStyle subtitle(BuildContext context) {
    return TextStyle(
      fontSize: ResponsiveUtils.getResponsiveFontSize(context, 18),
      fontWeight: FontWeight.w600,
      color: Colors.white,
    );
  }
  
  static TextStyle body(BuildContext context) {
    return TextStyle(
      fontSize: ResponsiveUtils.getResponsiveFontSize(context, 16),
      color: Colors.white,
    );
  }
  
  static TextStyle caption(BuildContext context) {
    return TextStyle(
      fontSize: ResponsiveUtils.getResponsiveFontSize(context, 14),
      color: Colors.white70,
    );
  }
  
  static TextStyle button(BuildContext context) {
    return TextStyle(
      fontSize: ResponsiveUtils.getResponsiveFontSize(context, 16),
      fontWeight: FontWeight.w600,
      color: Colors.white,
    );
  }
}
