import { useState, useCallback } from 'react'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

export function useFormValidation<T extends Record<string, any>>(
  initialValues: T,
  validationRules: ValidationRules
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validateField = useCallback((name: string, value: any): string | null => {
    const rule = validationRules[name]
    if (!rule) return null

    // Required validation
    if (rule.required && (!value || value.trim() === '')) {
      return 'Este campo é obrigatório'
    }

    // Min length validation
    if (rule.minLength && value && value.length < rule.minLength) {
      return `Mínimo de ${rule.minLength} caracteres`
    }

    // Max length validation
    if (rule.maxLength && value && value.length > rule.maxLength) {
      return `Máximo de ${rule.maxLength} caracteres`
    }

    // Pattern validation
    if (rule.pattern && value && !rule.pattern.test(value)) {
      return 'Formato inválido'
    }

    // Custom validation
    if (rule.custom) {
      return rule.custom(value)
    }

    return null
  }, [validationRules])

  const validateForm = useCallback((): boolean => {
    const newErrors: ValidationErrors = {}
    let isValid = true

    Object.keys(validationRules).forEach(fieldName => {
      const error = validateField(fieldName, values[fieldName])
      if (error) {
        newErrors[fieldName] = error
        isValid = false
      }
    })

    setErrors(newErrors)
    return isValid
  }, [values, validationRules, validateField])

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }))
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }, [errors])

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }))
    
    // Validate field on blur
    const error = validateField(name, values[name])
    setErrors(prev => ({ ...prev, [name]: error || '' }))
  }, [values, validateField])

  const handleSubmit = useCallback(async (onSubmit: (values: T) => Promise<void>) => {
    setIsSubmitting(true)
    
    try {
      if (validateForm()) {
        await onSubmit(values)
      }
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [values, validateForm])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
    setIsSubmitting(false)
  }, [initialValues])

  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  const getFieldProps = useCallback((name: string) => ({
    value: values[name],
    onChange: (value: any) => handleChange(name, value),
    onBlur: () => handleBlur(name),
    error: errors[name],
    isTouched: touched[name],
    hasError: touched[name] && errors[name],
  }), [values, errors, touched, handleChange, handleBlur])

  return {
    values,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
    getFieldProps,
    validateForm,
    clearErrors,
  }
}
