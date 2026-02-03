import 'package:flutter/material.dart';

class ValidationRule {
  final bool required;
  final int? minLength;
  final int? maxLength;
  final RegExp? pattern;
  final String? Function(String?)? custom;

  const ValidationRule({
    this.required = false,
    this.minLength,
    this.maxLength,
    this.pattern,
    this.custom,
  });
}

class FormValidationHook {
  final Map<String, TextEditingController> controllers;
  final Map<String, String?> errors;
  final Map<String, bool> touched;
  final bool isSubmitting;
  final Function(String, String?) setError;
  final Function(String) setTouched;
  final Function(bool) setSubmitting;

  FormValidationHook({
    required this.controllers,
    required this.errors,
    required this.touched,
    required this.isSubmitting,
    required this.setError,
    required this.setTouched,
    required this.setSubmitting,
  });

  String? validateField(String fieldName, String? value, ValidationRule rule) {
    // Required validation
    if (rule.required && (value == null || value.trim().isEmpty)) {
      return 'Este campo é obrigatório';
    }

    if (value != null && value.isNotEmpty) {
      // Min length validation
      if (rule.minLength != null && value.length < rule.minLength!) {
        return 'Mínimo de ${rule.minLength} caracteres';
      }

      // Max length validation
      if (rule.maxLength != null && value.length > rule.maxLength!) {
        return 'Máximo de ${rule.maxLength} caracteres';
      }

      // Pattern validation
      if (rule.pattern != null && !rule.pattern!.hasMatch(value)) {
        return 'Formato inválido';
      }

      // Custom validation
      if (rule.custom != null) {
        return rule.custom!(value);
      }
    }

    return null;
  }

  bool validateForm(Map<String, ValidationRule> rules) {
    bool isValid = true;
    
    for (String fieldName in rules.keys) {
      final controller = controllers[fieldName];
      if (controller != null) {
        final error = validateField(fieldName, controller.text, rules[fieldName]!);
        setError(fieldName, error);
        if (error != null) {
          isValid = false;
        }
      }
    }
    
    return isValid;
  }

  void handleFieldChange(String fieldName) {
    // Clear error when user starts typing
    if (errors[fieldName] != null) {
      setError(fieldName, null);
    }
  }

  void handleFieldBlur(String fieldName, ValidationRule rule) {
    setTouched(fieldName);
    
    // Validate field on blur
    final controller = controllers[fieldName];
    if (controller != null) {
      final error = validateField(fieldName, controller.text, rule);
      setError(fieldName, error);
    }
  }

  Future<bool> handleSubmit(
    Map<String, ValidationRule> rules,
    Future<void> Function(Map<String, String>) onSubmit,
  ) async {
    setSubmitting(true);
    
    try {
      if (validateForm(rules)) {
        final values = <String, String>{};
        for (String fieldName in controllers.keys) {
          values[fieldName] = controllers[fieldName]!.text;
        }
        
        await onSubmit(values);
        return true;
      }
      return false;
    } catch (error) {
      debugPrint('Form submission error: $error');
      return false;
    } finally {
      setSubmitting(false);
    }
  }

  void resetForm() {
    for (var controller in controllers.values) {
      controller.clear();
    }
    // Reset errors and touched states
    // This would need to be implemented in the parent widget
  }

  void clearErrors() {
    // Clear all errors
    // This would need to be implemented in the parent widget
  }
}
