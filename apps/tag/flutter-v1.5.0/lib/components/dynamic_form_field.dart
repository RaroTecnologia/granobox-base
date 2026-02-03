import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../models/label_template_models.dart';
import '../theme/app_theme.dart';

class DynamicFormField extends StatefulWidget {
  final FieldSchema field;
  final dynamic initialValue;
  final Function(dynamic) onChanged;
  final bool enabled;

  const DynamicFormField({
    Key? key,
    required this.field,
    this.initialValue,
    required this.onChanged,
    this.enabled = true,
  }) : super(key: key);

  @override
  State<DynamicFormField> createState() => _DynamicFormFieldState();
}

class _DynamicFormFieldState extends State<DynamicFormField> {
  late TextEditingController _controller;
  dynamic _currentValue;

  @override
  void initState() {
    super.initState();
    _currentValue = widget.initialValue ?? widget.field.defaultValue;
    _controller = TextEditingController(
      text: _currentValue?.toString() ?? '',
    );
  }

  @override
  void didUpdateWidget(DynamicFormField oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialValue != oldWidget.initialValue) {
      _currentValue = widget.initialValue;
      _controller.text = _currentValue?.toString() ?? '';
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Se campo está oculto, não renderizar
    if (widget.field.hidden == true) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Label do campo
          _buildLabel(),
          const SizedBox(height: 8),
          
          // Campo baseado no tipo
          _buildField(),
          
          // Help text
          if (widget.field.helpText != null) ...[
            const SizedBox(height: 4),
            Text(
              widget.field.helpText!,
              style: TextStyle(
                fontSize: 12,
                color: AppTheme.dark300,
                fontStyle: FontStyle.italic,
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLabel() {
    return Row(
      children: [
        Text(
          widget.field.label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: widget.field.required ? AppTheme.primary : Colors.white70,
          ),
        ),
        if (widget.field.required)
          const Text(
            ' *',
            style: TextStyle(color: Colors.red, fontSize: 14),
          ),
        if (widget.field.readonly == true) ...[
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: AppTheme.dark600,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              'Auto',
              style: TextStyle(
                fontSize: 10,
                color: AppTheme.dark300,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildField() {
    switch (widget.field.type) {
      case FieldType.text:
        return _buildTextField();
      case FieldType.textarea:
        return _buildTextAreaField();
      case FieldType.number:
        return _buildNumberField();
      case FieldType.decimal:
        return _buildDecimalField();
      case FieldType.date:
        return _buildDateField();
      case FieldType.select:
        return _buildSelectField();
      case FieldType.boolean:
        return _buildBooleanField();
      default:
        return _buildTextField();
    }
  }

  Widget _buildTextField() {
    return TextField(
      controller: _controller,
      enabled: widget.enabled && widget.field.readonly != true,
      decoration: InputDecoration(
        hintText: widget.field.placeholder,
        prefixText: widget.field.prefix,
        suffixText: widget.field.suffix,
        filled: true,
        fillColor: widget.field.readonly == true ? AppTheme.dark600 : AppTheme.dark700,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primary),
        ),
      ),
      style: TextStyle(color: Colors.white),
      onChanged: (value) {
        _currentValue = value;
        widget.onChanged(value);
      },
    );
  }

  Widget _buildTextAreaField() {
    return TextField(
      controller: _controller,
      enabled: widget.enabled && widget.field.readonly != true,
      maxLines: widget.field.rows ?? 5,
      decoration: InputDecoration(
        hintText: widget.field.placeholder,
        filled: true,
        fillColor: AppTheme.dark700,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primary),
        ),
      ),
      style: TextStyle(color: Colors.white, fontSize: 13),
      onChanged: (value) {
        _currentValue = value;
        widget.onChanged(value);
      },
    );
  }

  Widget _buildNumberField() {
    return TextField(
      controller: _controller,
      enabled: widget.enabled && widget.field.readonly != true,
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      decoration: InputDecoration(
        hintText: widget.field.placeholder,
        prefixText: widget.field.prefix,
        suffixText: widget.field.suffix,
        filled: true,
        fillColor: AppTheme.dark700,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primary),
        ),
      ),
      style: TextStyle(color: Colors.white),
      onChanged: (value) {
        _currentValue = int.tryParse(value);
        widget.onChanged(_currentValue);
      },
    );
  }

  Widget _buildDecimalField() {
    return TextField(
      controller: _controller,
      enabled: widget.enabled && widget.field.readonly != true,
      keyboardType: TextInputType.numberWithOptions(decimal: true),
      inputFormatters: [
        FilteringTextInputFormatter.allow(RegExp(r'^\d*\.?\d*')),
      ],
      decoration: InputDecoration(
        hintText: widget.field.placeholder,
        prefixText: widget.field.prefix,
        suffixText: widget.field.suffix,
        filled: true,
        fillColor: AppTheme.dark700,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primary),
        ),
      ),
      style: TextStyle(color: Colors.white),
      onChanged: (value) {
        _currentValue = double.tryParse(value);
        widget.onChanged(_currentValue);
      },
    );
  }

  Widget _buildDateField() {
    return GestureDetector(
      onTap: widget.enabled && widget.field.readonly != true ? () => _selecionarData() : null,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: widget.field.readonly == true ? AppTheme.dark600 : AppTheme.dark700,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppTheme.dark600),
        ),
        child: Row(
          children: [
            Icon(
              PhosphorIcons.calendar,
              color: AppTheme.primary,
              size: 20,
            ),
            const SizedBox(width: 12),
            Text(
              _controller.text.isEmpty ? (widget.field.placeholder ?? 'Selecione uma data') : _controller.text,
              style: TextStyle(
                color: _controller.text.isEmpty ? AppTheme.dark300 : Colors.white,
                fontSize: 14,
              ),
            ),
            const Spacer(),
            if (widget.field.readonly != true)
              Icon(
                PhosphorIcons.caretDown,
                color: AppTheme.primary,
                size: 16,
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _selecionarData() async {
    // Parse min/max dates
    DateTime firstDate = DateTime.now().subtract(const Duration(days: 365));
    DateTime lastDate = DateTime.now().add(const Duration(days: 365 * 5));

    if (widget.field.minDate == 'today') {
      firstDate = DateTime.now();
    }

    final DateTime? pickedDate = await showDatePicker(
      context: context,
      initialDate: DateTime.now(),
      firstDate: firstDate,
      lastDate: lastDate,
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: ColorScheme.dark(
              primary: AppTheme.primary,
              onPrimary: Colors.white,
              surface: AppTheme.dark800,
              onSurface: Colors.white,
            ),
          ),
          child: child!,
        );
      },
    );

    if (pickedDate != null) {
      final formattedDate = '${pickedDate.day.toString().padLeft(2, '0')}/${pickedDate.month.toString().padLeft(2, '0')}/${pickedDate.year}';
      setState(() {
        _controller.text = formattedDate;
        _currentValue = formattedDate;
      });
      widget.onChanged(formattedDate);
    }
  }

  Widget _buildSelectField() {
    return DropdownButtonFormField<String>(
      value: _currentValue?.toString(),
      dropdownColor: AppTheme.dark800,
      decoration: InputDecoration(
        filled: true,
        fillColor: AppTheme.dark700,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.dark600),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppTheme.primary),
        ),
      ),
      style: TextStyle(color: Colors.white),
      items: (widget.field.options ?? []).map((option) {
        return DropdownMenuItem<String>(
          value: option,
          child: Text(option),
        );
      }).toList(),
      onChanged: widget.enabled && widget.field.readonly != true
          ? (value) {
              setState(() {
                _currentValue = value;
              });
              widget.onChanged(value);
            }
          : null,
    );
  }

  Widget _buildBooleanField() {
    final boolValue = _currentValue == true || _currentValue == 'true';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppTheme.dark700,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.dark600),
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              widget.field.placeholder ?? widget.field.label,
              style: TextStyle(color: Colors.white, fontSize: 14),
            ),
          ),
          Switch(
            value: boolValue,
            activeColor: AppTheme.primary,
            onChanged: widget.enabled && widget.field.readonly != true
                ? (value) {
                    setState(() {
                      _currentValue = value;
                    });
                    widget.onChanged(value);
                  }
                : null,
          ),
        ],
      ),
    );
  }
}


