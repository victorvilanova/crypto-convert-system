/**
 * FormManager - Gerenciador de formulários com validação
 * Facilita a criação, validação e submissão de formulários
 */

// Tipos de campos suportados
const FIELD_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  EMAIL: 'email',
  PASSWORD: 'password',
  SELECT: 'select',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  TEXTAREA: 'textarea',
  DATE: 'date',
  FILE: 'file'
};

// Regras de validação padrão
const VALIDATION_RULES = {
  required: (value) => !!value || (Array.isArray(value) && value.length > 0) || 'Campo obrigatório',
  email: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Email inválido',
  minLength: (length) => (value) => !value || value.length >= length || `Mínimo de ${length} caracteres`,
  maxLength: (length) => (value) => !value || value.length <= length || `Máximo de ${length} caracteres`,
  min: (min) => (value) => !value || Number(value) >= min || `Valor mínimo: ${min}`,
  max: (max) => (value) => !value || Number(value) <= max || `Valor máximo: ${max}`,
  pattern: (regex, message) => (value) => !value || regex.test(value) || message || 'Formato inválido',
  match: (fieldName, message) => (value, allValues) => !value || !allValues[fieldName] || value === allValues[fieldName] || message || 'Os valores não coincidem'
};

/**
 * Classe para gerenciar formulários
 */
export class FormManager {
  /**
   * @param {Object} options - Opções do formulário
   * @param {Object} options.fields - Definição dos campos do formulário
   * @param {Function} options.onSubmit - Função a ser executada no envio bem-sucedido
   * @param {Function} options.onChange - Função a ser executada quando algum valor mudar
   */
  constructor(options = {}) {
    this.fields = options.fields || {};
    this.onSubmit = options.onSubmit || (() => {});
    this.onChange = options.onChange || (() => {});
    
    // Inicializar valores e erros
    this.values = {};
    this.errors = {};
    this.touched = {};
    this.isSubmitting = false;
    this.isValid = true;
    
    // Inicializar valores padrão
    this._initializeValues();
  }

  /**
   * Inicializa os valores padrão e erros dos campos
   * @private
   */
  _initializeValues() {
    Object.keys(this.fields).forEach(fieldName => {
      const field = this.fields[fieldName];
      this.values[fieldName] = field.defaultValue !== undefined ? field.defaultValue : '';
      this.errors[fieldName] = '';
      this.touched[fieldName] = false;
    });
    
    this._validate();
  }

  /**
   * Valida todos ou um campo específico
   * @private
   * @param {string} [fieldName] - Nome do campo a ser validado (opcional)
   * @returns {boolean} - Indica se os campos estão válidos
   */
  _validate(fieldName) {
    let isValid = true;
    
    const fieldsToValidate = fieldName 
      ? { [fieldName]: this.fields[fieldName] } 
      : this.fields;
    
    Object.keys(fieldsToValidate).forEach(name => {
      const field = this.fields[name];
      const value = this.values[name];
      
      // Pular validação para campos desabilitados
      if (field.disabled) {
        this.errors[name] = '';
        return;
      }
      
      if (field.validate) {
        // Validações personalizadas
        if (Array.isArray(field.validate)) {
          for (const validator of field.validate) {
            const result = validator(value, this.values);
            
            if (result !== true && result !== undefined) {
              this.errors[name] = result;
              isValid = false;
              break;
            } else {
              this.errors[name] = '';
            }
          }
        } else {
          // Uma função de validação única
          const result = field.validate(value, this.values);
          
          if (result !== true && result !== undefined) {
            this.errors[name] = result;
            isValid = false;
          } else {
            this.errors[name] = '';
          }
        }
      } else {
        this.errors[name] = '';
      }
    });
    
    this.isValid = fieldName ? isValid && this._validateOtherFields(fieldName) : isValid;
    return this.isValid;
  }

  /**
   * Valida todos os campos exceto o especificado
   * @private
   * @param {string} excludeFieldName - Nome do campo a ser excluído da validação
   * @returns {boolean} - Indica se os outros campos estão válidos
   */
  _validateOtherFields(excludeFieldName) {
    let isValid = true;
    
    Object.keys(this.fields).forEach(name => {
      if (name !== excludeFieldName && this.errors[name]) {
        isValid = false;
      }
    });
    
    return isValid;
  }

  /**
   * Atualiza o valor de um campo
   * @param {string} fieldName - Nome do campo
   * @param {any} value - Novo valor
   */
  setValue(fieldName, value) {
    if (!this.fields[fieldName]) {
      console.warn(`Campo "${fieldName}" não definido neste formulário`);
      return;
    }
    
    this.values[fieldName] = value;
    this.touched[fieldName] = true;
    
    // Validar este campo
    this._validate(fieldName);
    
    // Executar onChange
    this.onChange({
      name: fieldName,
      value,
      values: { ...this.values },
      errors: { ...this.errors },
      isValid: this.isValid
    });
  }

  /**
   * Define vários valores de uma vez
   * @param {Object} newValues - Objeto com os novos valores
   */
  setValues(newValues) {
    let hasChanged = false;
    
    Object.keys(newValues).forEach(fieldName => {
      if (this.fields[fieldName] && this.values[fieldName] !== newValues[fieldName]) {
        this.values[fieldName] = newValues[fieldName];
        this.touched[fieldName] = true;
        hasChanged = true;
      }
    });
    
    if (hasChanged) {
      this._validate();
      
      this.onChange({
        values: { ...this.values },
        errors: { ...this.errors },
        isValid: this.isValid
      });
    }
  }

  /**
   * Reseta o formulário para os valores iniciais
   */
  reset() {
    this._initializeValues();
    
    Object.keys(this.touched).forEach(fieldName => {
      this.touched[fieldName] = false;
    });
    
    this.isSubmitting = false;
    
    this.onChange({
      values: { ...this.values },
      errors: { ...this.errors },
      isValid: this.isValid
    });
  }

  /**
   * Marca todos os campos como tocados e valida o formulário
   */
  validateAll() {
    Object.keys(this.fields).forEach(fieldName => {
      this.touched[fieldName] = true;
    });
    
    return this._validate();
  }

  /**
   * Processa a submissão do formulário
   * @param {Event} [event] - Evento de submit (opcional)
   * @returns {Promise} - Promise resolvida com os valores ou rejeitada com erros
   */
  handleSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }
    
    this.isSubmitting = true;
    
    // Validar todos os campos
    const isValid = this.validateAll();
    
    if (isValid) {
      const result = this.onSubmit(this.values);
      
      // Se o resultado for uma Promise, aguarde por ela
      if (result && typeof result.then === 'function') {
        return result
          .then(response => {
            this.isSubmitting = false;
            return response;
          })
          .catch(error => {
            this.isSubmitting = false;
            throw error;
          });
      }
      
      this.isSubmitting = false;
      return Promise.resolve(result);
    }
    
    this.isSubmitting = false;
    return Promise.reject(this.errors);
  }

  /**
   * Obtém props para um campo específico
   * @param {string} fieldName - Nome do campo
   * @returns {Object} - Props para o campo
   */
  getFieldProps(fieldName) {
    if (!this.fields[fieldName]) {
      console.warn(`Campo "${fieldName}" não definido neste formulário`);
      return {};
    }
    
    const field = this.fields[fieldName];
    
    // Props básicas para todos os tipos de campos
    const props = {
      name: fieldName,
      id: field.id || `field-${fieldName}`,
      value: this.values[fieldName],
      onChange: (e) => {
        const value = e && e.target 
          ? field.type === FIELD_TYPES.CHECKBOX 
            ? e.target.checked
            : e.target.value
          : e;
        
        this.setValue(fieldName, value);
      },
      onBlur: () => {
        if (!this.touched[fieldName]) {
          this.touched[fieldName] = true;
          this._validate(fieldName);
        }
      },
      disabled: field.disabled,
      required: field.validate && field.validate.includes(VALIDATION_RULES.required),
      'aria-invalid': !!this.errors[fieldName] && this.touched[fieldName],
      'aria-describedby': field.id ? `${field.id}-error` : `field-${fieldName}-error`
    };
    
    // Props adicionais baseadas no tipo de campo
    switch (field.type) {
      case FIELD_TYPES.CHECKBOX:
        return {
          ...props,
          type: 'checkbox',
          checked: !!this.values[fieldName]
        };
        
      case FIELD_TYPES.RADIO:
        return {
          ...props,
          type: 'radio'
        };
        
      case FIELD_TYPES.SELECT:
        return {
          ...props,
          options: field.options || []
        };
        
      case FIELD_TYPES.FILE:
        return {
          ...props,
          type: 'file',
          accept: field.accept,
          multiple: field.multiple
        };
        
      default:
        return {
          ...props,
          type: field.type || 'text',
          placeholder: field.placeholder || '',
          maxLength: field.maxLength,
          min: field.min,
          max: field.max,
          step: field.step,
          pattern: field.pattern
        };
    }
  }

  /**
   * Obtém o estado atual do formulário
   * @returns {Object} - Estado do formulário
   */
  getState() {
    return {
      values: { ...this.values },
      errors: { ...this.errors },
      touched: { ...this.touched },
      isSubmitting: this.isSubmitting,
      isValid: this.isValid
    };
  }
}

/**
 * Cria um novo gerenciador de formulário
 * @param {Object} options - Opções do formulário
 * @returns {FormManager} - Instância do FormManager
 */
export const createForm = (options) => new FormManager(options);

/**
 * Regras de validação pré-definidas
 */
export const validators = { ...VALIDATION_RULES };

/**
 * Tipos de campos disponíveis
 */
export const fieldTypes = { ...FIELD_TYPES };

/**
 * Exportação de objeto com funções de conveniência
 */
export default {
  createForm,
  validators,
  fieldTypes
};