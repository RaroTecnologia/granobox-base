import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../theme/app_theme.dart';

class CustomInputField extends StatelessWidget {
  final String label;
  final String? hintText;
  final TextEditingController? controller;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;
  final bool isRequired;
  final bool isEnabled;
  final int? maxLines;
  final Widget? suffixIcon;
  final Widget? prefixIcon;
  final VoidCallback? onTap;
  final bool readOnly;
  final String? initialValue;
  final Function(String)? onChanged;
  final TextAlign textAlign;
  final Color? borderColor;
  final Color? labelColor;
  final Color? backgroundColor;

  const CustomInputField({
    super.key,
    required this.label,
    this.hintText,
    this.controller,
    this.keyboardType,
    this.validator,
    this.isRequired = false,
    this.isEnabled = true,
    this.maxLines = 1,
    this.suffixIcon,
    this.prefixIcon,
    this.onTap,
    this.readOnly = false,
    this.initialValue,
    this.onChanged,
    this.textAlign = TextAlign.start,
    this.borderColor,
    this.labelColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBorderColor = borderColor ?? 
        (isRequired ? AppTheme.primary : AppTheme.dark600);
    final effectiveLabelColor = labelColor ?? 
        (isRequired ? AppTheme.primary : Colors.white70);
    final effectiveBackgroundColor = backgroundColor ?? AppTheme.dark700;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: effectiveBackgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: effectiveBorderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label
          Text(
            isRequired ? '$label *' : label,
            style: TextStyle(
              fontSize: 16,
              color: effectiveLabelColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          
          // Input Field
          TextFormField(
            controller: controller,
            initialValue: initialValue,
            keyboardType: keyboardType,
            validator: validator,
            enabled: isEnabled,
            maxLines: maxLines,
            readOnly: readOnly,
            onTap: onTap,
            onChanged: onChanged,
            textAlign: textAlign,
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: const TextStyle(color: Colors.white54),
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
              suffixIcon: suffixIcon,
              prefixIcon: prefixIcon,
            ),
            style: const TextStyle(
              color: Colors.white, 
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}

// Componente específico para dropdowns
class CustomDropdownField extends StatelessWidget {
  final String label;
  final String? value;
  final String? hintText;
  final List<DropdownMenuItem<String>>? items;
  final Function(String?)? onChanged;
  final bool isRequired;
  final Color? borderColor;
  final Color? labelColor;
  final Color? backgroundColor;

  const CustomDropdownField({
    super.key,
    required this.label,
    this.value,
    this.hintText,
    this.items,
    this.onChanged,
    this.isRequired = false,
    this.borderColor,
    this.labelColor,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBorderColor = borderColor ?? 
        (isRequired ? AppTheme.primary : AppTheme.dark600);
    final effectiveLabelColor = labelColor ?? 
        (isRequired ? AppTheme.primary : Colors.white70);
    final effectiveBackgroundColor = backgroundColor ?? AppTheme.dark700;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: effectiveBackgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: effectiveBorderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label
          Text(
            isRequired ? '$label *' : label,
            style: TextStyle(
              fontSize: 16,
              color: effectiveLabelColor,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          
          // Dropdown
          DropdownButtonFormField<String>(
            value: value,
            items: items,
            onChanged: onChanged,
            decoration: const InputDecoration(
              hintText: 'Selecione uma opção',
              hintStyle: TextStyle(color: Colors.white54),
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
            ),
            style: const TextStyle(
              color: Colors.white, 
              fontSize: 16,
            ),
            dropdownColor: AppTheme.dark700,
            icon: Icon(
              PhosphorIcons.caretDown,
              color: effectiveLabelColor,
              size: 16,
            ),
          ),
        ],
      ),
    );
  }
}

// Componente para campos de validade (com ícone)
class CustomValidityField extends StatelessWidget {
  final String label;
  final String? hintText;
  final TextEditingController? controller;
  final IconData icon;
  final String? Function(String?)? validator;
  final bool isRequired;
  final Color? borderColor;
  final Color? labelColor;
  final Color? backgroundColor;
  final Color? iconColor;

  const CustomValidityField({
    super.key,
    required this.label,
    required this.icon,
    this.hintText,
    this.controller,
    this.validator,
    this.isRequired = false,
    this.borderColor,
    this.labelColor,
    this.backgroundColor,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveBorderColor = borderColor ?? AppTheme.dark600;
    final effectiveLabelColor = labelColor ?? Colors.white70;
    final effectiveBackgroundColor = backgroundColor ?? AppTheme.dark700;
    final effectiveIconColor = iconColor ?? Colors.white70;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: effectiveBackgroundColor,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: effectiveBorderColor),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Label com ícone
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: effectiveIconColor,
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                isRequired ? '$label *' : label,
                style: TextStyle(
                  fontSize: 16,
                  color: effectiveLabelColor,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          
          // Input Field centralizado
          TextFormField(
            controller: controller,
            validator: validator,
            textAlign: TextAlign.center,
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              hintText: hintText,
              hintStyle: const TextStyle(color: Colors.white54),
              border: InputBorder.none,
              contentPadding: EdgeInsets.zero,
            ),
            style: const TextStyle(
              color: Colors.white, 
              fontSize: 16,
            ),
          ),
        ],
      ),
    );
  }
}
