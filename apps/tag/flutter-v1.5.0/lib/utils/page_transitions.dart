import 'package:flutter/material.dart';

/// Transições de página modernas para o app
class AppPageTransitions {
  /// Transição moderna Slide + Fade (Material Design 3)
  /// Desliza da direita para esquerda com fade simultâneo
  static Route<T> slideAndFadeTransition<T>({
    required Widget page,
    Duration duration = const Duration(milliseconds: 300),
    Curve curve = Curves.easeOutCubic,
  }) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionDuration: duration,
      reverseTransitionDuration: duration,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        // Animação de slide (da direita para esquerda)
        const begin = Offset(1.0, 0.0);
        const end = Offset.zero;
        final slideTween = Tween(begin: begin, end: end).chain(
          CurveTween(curve: curve),
        );
        
        // Animação de fade (0.0 -> 1.0)
        final fadeTween = Tween<double>(begin: 0.0, end: 1.0).chain(
          CurveTween(curve: curve),
        );
        
        return SlideTransition(
          position: animation.drive(slideTween),
          child: FadeTransition(
            opacity: animation.drive(fadeTween),
            child: child,
          ),
        );
      },
    );
  }

  /// Transição Scale + Fade (estilo iOS)
  /// Cresce do centro com fade
  static Route<T> scaleAndFadeTransition<T>({
    required Widget page,
    Duration duration = const Duration(milliseconds: 350),
    Curve curve = Curves.easeOutCubic,
  }) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionDuration: duration,
      reverseTransitionDuration: duration,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        // Animação de scale (começa um pouco menor)
        final scaleTween = Tween<double>(begin: 0.92, end: 1.0).chain(
          CurveTween(curve: curve),
        );
        
        // Animação de fade
        final fadeTween = Tween<double>(begin: 0.0, end: 1.0).chain(
          CurveTween(curve: curve),
        );
        
        return ScaleTransition(
          scale: animation.drive(scaleTween),
          child: FadeTransition(
            opacity: animation.drive(fadeTween),
            child: child,
          ),
        );
      },
    );
  }

  /// Transição Shared Axis (Material Design)
  /// Slide com movimento compartilhado - a tela antiga sai enquanto a nova entra
  static Route<T> sharedAxisTransition<T>({
    required Widget page,
    Duration duration = const Duration(milliseconds: 300),
    Curve curve = Curves.easeInOutCubic,
  }) {
    return PageRouteBuilder<T>(
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionDuration: duration,
      reverseTransitionDuration: duration,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        // Tela nova entra da direita
        const enterBegin = Offset(0.3, 0.0);
        const enterEnd = Offset.zero;
        final enterSlideTween = Tween(begin: enterBegin, end: enterEnd).chain(
          CurveTween(curve: curve),
        );
        
        // Tela antiga sai para a esquerda
        const exitBegin = Offset.zero;
        const exitEnd = Offset(-0.3, 0.0);
        final exitSlideTween = Tween(begin: exitBegin, end: exitEnd).chain(
          CurveTween(curve: curve),
        );
        
        // Fade in para a nova tela
        final fadeTween = Tween<double>(begin: 0.0, end: 1.0).chain(
          CurveTween(curve: curve),
        );
        
        // Fade out para a tela antiga
        final reverseFadeTween = Tween<double>(begin: 1.0, end: 0.0).chain(
          CurveTween(curve: curve),
        );
        
        return Stack(
          children: [
            // Tela antiga saindo
            SlideTransition(
              position: secondaryAnimation.drive(exitSlideTween),
              child: FadeTransition(
                opacity: secondaryAnimation.drive(reverseFadeTween),
                child: Container(), // Tela anterior (será substituída automaticamente)
              ),
            ),
            // Tela nova entrando
            SlideTransition(
              position: animation.drive(enterSlideTween),
              child: FadeTransition(
                opacity: animation.drive(fadeTween),
                child: child,
              ),
            ),
          ],
        );
      },
    );
  }
}


