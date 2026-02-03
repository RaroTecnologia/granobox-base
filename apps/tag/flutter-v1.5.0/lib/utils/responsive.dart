import 'package:flutter/material.dart';

class ResponsiveUtils {
  static double getResponsiveFontSize(BuildContext context, double baseFontSize) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    
    // Calcular fator de escala baseado na resolução
    double scaleFactor = 1.0;
    
    // Para tablets pequenos (~1024x600)
    if (screenWidth >= 800 && screenWidth <= 1200 && screenHeight <= 700) {
      scaleFactor = 1.3; // Aumentar fonte em 30%
    }
    // Para tablets médios
    else if (screenWidth > 1200 && screenWidth <= 1600) {
      scaleFactor = 1.2; // Aumentar fonte em 20%
    }
    // Para tablets grandes
    else if (screenWidth > 1600) {
      scaleFactor = 1.4; // Aumentar fonte em 40%
    }
    // Para telas pequenas (celulares), manter tamanho original
    else {
      scaleFactor = 1.0;
    }
    
    return baseFontSize * scaleFactor;
  }
  
  static double getResponsivePadding(BuildContext context, double basePadding) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    // Ajustar padding baseado no tamanho da tela
    if (screenWidth >= 800 && screenWidth <= 1200) {
      return basePadding * 1.2; // Aumentar padding em 20%
    } else if (screenWidth > 1200) {
      return basePadding * 1.4; // Aumentar padding em 40%
    }
    
    return basePadding;
  }
  
  static double getResponsiveIconSize(BuildContext context, double baseIconSize) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    // Ajustar tamanho dos ícones
    if (screenWidth >= 800 && screenWidth <= 1200) {
      return baseIconSize * 1.2; // Aumentar ícones em 20%
    } else if (screenWidth > 1200) {
      return baseIconSize * 1.4; // Aumentar ícones em 40%
    }
    
    return baseIconSize;
  }
  
  // Verificar se é tablet pequeno
  static bool isSmallTablet(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final screenHeight = MediaQuery.of(context).size.height;
    
    return screenWidth >= 800 && screenWidth <= 1200 && screenHeight <= 700;
  }
  
  // Verificar se é tablet médio
  static bool isMediumTablet(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    return screenWidth > 1200 && screenWidth <= 1600;
  }
  
  // Verificar se é tablet grande
  static bool isLargeTablet(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    return screenWidth > 1600;
  }
}
