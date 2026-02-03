import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';

class FormInput extends StatelessWidget {
  final String? label;
  final String? error;
  final bool hasError;
  final IconData? icon;
  final IconData? suffixIcon;
  final VoidCallback? onSuffixIconTap;
  final String? hintText;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final bool obscureText;
  final VoidCallback? onTap;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onEditingComplete;
  final FocusNode? focusNode;
  final bool enabled;
  final int? maxLines;
  final int? maxLength;
  final String? Function(String?)? validator;

  const FormInput({
    super.key,
    this.label,
    this.error,
    this.hasError = false,
    this.icon,
    this.suffixIcon,
    this.onSuffixIconTap,
    this.hintText,
    this.controller,
    this.keyboardType,
    this.obscureText = false,
    this.onTap,
    this.onChanged,
    this.onEditingComplete,
    this.focusNode,
    this.enabled = true,
    this.maxLines = 1,
    this.maxLength,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (label != null) ...[
          Text(
            label!,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
              color: hasError 
                  ? Colors.red 
                  : (isDark ? AppTheme.dark300 : AppTheme.dark700),
            ),
          ),
          const SizedBox(height: 8),
        ],
        
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          onTap: onTap,
          onChanged: onChanged,
          onEditingComplete: onEditingComplete,
          focusNode: focusNode,
          enabled: enabled,
          maxLines: maxLines,
          maxLength: maxLength,
          validator: validator,
          decoration: InputDecoration(
            hintText: hintText,
            prefixIcon: icon != null 
                ? Icon(
                    icon,
                    size: 20,
                    color: hasError 
                        ? Colors.red 
                        : (isDark ? AppTheme.dark400 : AppTheme.light500),
                  )
                : null,
            suffixIcon: suffixIcon != null 
                ? GestureDetector(
                    onTap: onSuffixIconTap,
                    child: Icon(
                      suffixIcon,
                      size: 20,
                      color: hasError 
                          ? Colors.red 
                          : (isDark ? AppTheme.dark400 : AppTheme.light500),
                    ),
                  )
                : (hasError 
                    ? const Icon(
                        PhosphorIcons.warning,
                        size: 20,
                        color: Colors.red,
                      )
                    : null),
            errorText: hasError ? error : null,
            errorStyle: const TextStyle(
              color: Colors.red,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }
}
