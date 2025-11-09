/**
 * Sistema de Comandos JSON para AI Browser Overlay
 * Define la estructura y validación de todos los comandos soportados
 */

class CommandSystem {
  constructor() {
    this.commandSchemas = new Map();
    this.validators = new Map();
    this.middleware = [];
    this.commandHistory = [];
    this.plugins = new Map();

    this.init();
  }

  init() {
    this.setupCommandSchemas();
    this.setupValidators();
  }

  setupCommandSchemas() {
    // Comandos de Dibujo (Overlay)
    this.addCommandSchema('draw', {
      description: 'Dibuja elementos personalizados en el overlay',
      parameters: {
        type: { type: 'string', required: true, enum: ['custom'] },
        data: { type: 'object', required: true },
        id: { type: 'string', required: false }
      },
      examples: [
        {
          type: 'custom',
          data: { x: 100, y: 100, width: 50, height: 50, color: '#ff4081' },
          id: 'custom_shape_1'
        }
      ]
    });

    this.addCommandSchema('arrow', {
      description: 'Dibuja una flecha entre dos puntos',
      parameters: {
        from: { type: 'array', required: true, length: 2, items: 'number' },
        to: { type: 'array', required: true, length: 2, items: 'number' },
        color: { type: 'string', required: false, default: '#ff4081' },
        width: { type: 'number', required: false, default: 2 },
        style: { type: 'string', required: false, enum: ['solid', 'dashed'], default: 'solid' },
        animated: { type: 'boolean', required: false, default: false },
        id: { type: 'string', required: false }
      },
      examples: [
        {
          action: 'arrow',
          from: [100, 100],
          to: [300, 200],
          color: '#ff4081',
          width: 3,
          animated: true
        }
      ]
    });

    this.addCommandSchema('circle', {
      description: 'Dibuja un círculo en el overlay',
      parameters: {
        center: { type: 'array', required: true, length: 2, items: 'number' },
        radius: { type: 'number', required: true, min: 1 },
        color: { type: 'string', required: false, default: '#ff4081' },
        fill: { type: 'boolean', required: false, default: false },
        fillColor: { type: 'string', required: false, default: 'rgba(255, 64, 129, 0.2)' },
        width: { type: 'number', required: false, default: 2 },
        id: { type: 'string', required: false }
      }
    });

    this.addCommandSchema('rectangle', {
      description: 'Dibuja un rectángulo en el overlay',
      parameters: {
        x: { type: 'number', required: true },
        y: { type: 'number', required: true },
        width: { type: 'number', required: true, min: 1 },
        height: { type: 'number', required: true, min: 1 },
        color: { type: 'string', required: false, default: '#ff4081' },
        fill: { type: 'boolean', required: false, default: false },
        fillColor: { type: 'string', required: false, default: 'rgba(255, 64, 129, 0.2)' },
        borderRadius: { type: 'number', required: false, default: 0 },
        id: { type: 'string', required: false }
      }
    });

    this.addCommandSchema('text', {
      description: 'Añade texto en el overlay',
      parameters: {
        text: { type: 'string', required: true, maxLength: 200 },
        position: { type: 'array', required: true, length: 2, items: 'number' },
        color: { type: 'string', required: false, default: '#ffffff' },
        fontSize: { type: 'number', required: false, default: 16, min: 8, max: 72 },
        fontFamily: { type: 'string', required: false, default: 'Arial, sans-serif' },
        backgroundColor: { type: 'string', required: false, default: 'rgba(33, 33, 33, 0.9)' },
        padding: { type: 'number', required: false, default: 8 },
        borderRadius: { type: 'number', required: false, default: 4 },
        id: { type: 'string', required: false }
      }
    });

    // Comandos de Manipulación DOM
    this.addCommandSchema('highlight', {
      description: 'Resalta elementos del DOM',
      parameters: {
        selector: { type: 'string', required: true },
        style: { type: 'object', required: false },
        options: { type: 'object', required: false },
        id: { type: 'string', required: false }
      },
      examples: [
        {
          action: 'highlight',
          selector: 'button.submit',
          style: {
            outline: '3px solid #ff4081',
            boxShadow: '0 0 15px rgba(255, 64, 129, 0.5)'
          },
          options: {
            addIndicator: true
          }
        }
      ]
    });

    this.addCommandSchema('modify_style', {
      description: 'Modifica estilos de elementos del DOM',
      parameters: {
        selector: { type: 'string', required: true },
        styles: { type: 'object', required: true },
        id: { type: 'string', required: false }
      }
    });

    this.addCommandSchema('hide', {
      description: 'Oculta elementos del DOM',
      parameters: {
        selector: { type: 'string', required: true },
        id: { type: 'string', required: false }
      }
    });

    this.addCommandSchema('show', {
      description: 'Muestra elementos ocultos del DOM',
      parameters: {
        selector: { type: 'string', required: true },
        id: { type: 'string', required: false }
      }
    });

    this.addCommandSchema('click_element', {
      description: 'Simula clic en un elemento',
      parameters: {
        selector: { type: 'string', required: true },
        id: { type: 'string', required: false }
      }
    });

    this.addCommandSchema('scroll_to', {
      description: 'Hace scroll a un elemento',
      parameters: {
        selector: { type: 'string', required: true },
        options: {
          behavior: { type: 'string', enum: ['smooth', 'auto'], default: 'smooth' },
          block: { type: 'string', enum: ['start', 'center', 'end', 'nearest'], default: 'center' },
          highlightAfterScroll: { type: 'boolean', default: false },
          scrollDelay: { type: 'number', default: 1000 },
          highlightDuration: { type: 'number', default: 3000 }
        },
        id: { type: 'string', required: false }
      }
    });

    // Comandos de Navegación
    this.addCommandSchema('navigate', {
      description: 'Navega a una URL específica',
      parameters: {
        url: { type: 'string', required: true, format: 'url' },
        id: { type: 'string', required: false }
      }
    });

    // Comandos de Captura y Análisis
    this.addCommandSchema('capture', {
      description: 'Captura la pantalla actual',
      parameters: {
        format: { type: 'string', required: false, enum: ['png', 'jpeg'], default: 'png' },
        quality: { type: 'number', required: false, min: 0.1, max: 1, default: 0.9 },
        id: { type: 'string', required: false }
      }
    });

    this.addCommandSchema('get_dom', {
      description: 'Obtiene y analiza la estructura DOM actual',
      parameters: {
        includeText: { type: 'boolean', required: false, default: true },
        includeStyles: { type: 'boolean', required: false, default: false },
        maxDepth: { type: 'number', required: false, default: 10 },
        id: { type: 'string', required: false }
      }
    });

    // Comandos de Control
    this.addCommandSchema('clear', {
      description: 'Limpia todos los elementos del overlay',
      parameters: {
        type: { type: 'string', required: false, enum: ['overlay', 'dom', 'all'], default: 'all' },
        id: { type: 'string', required: false }
      }
    });

    this.addCommandSchema('clear_element', {
      description: 'Elimina un elemento específico por ID',
      parameters: {
        id: { type: 'string', required: true }
      }
    });

    // Comandos de Animación
    this.addCommandSchema('animate', {
      description: 'Aplica animaciones a elementos',
      parameters: {
        animationType: { type: 'string', required: true, enum: ['pulse', 'fade', 'slide', 'bounce'] },
        target: { type: 'string', required: true },
        duration: { type: 'number', required: false, default: 1000 },
        iterations: { type: 'number', required: false, default: 1 },
        easing: { type: 'string', required: false, default: 'ease-in-out' },
        id: { type: 'string', required: false }
      }
    });

    // Comandos de Inyección
    this.addCommandSchema('inject_element', {
      description: 'Inyecta nuevos elementos en el DOM',
      parameters: {
        selector: { type: 'string', required: true },
        element: {
          type: 'object',
          required: true,
          properties: {
            tag: { type: 'string', required: true },
            attributes: { type: 'object', required: false },
            style: { type: 'object', required: false },
            html: { type: 'string', required: false },
            text: { type: 'string', required: false }
          }
        },
        position: { type: 'string', required: false, enum: ['beforebegin', 'afterbegin', 'beforeend', 'afterend'], default: 'beforeend' },
        id: { type: 'string', required: false }
      }
    });
  }

  setupValidators() {
    // Validador de selectores CSS
    this.addValidator('css_selector', (selector) => {
      try {
        document.querySelector(selector);
        return { valid: true };
      } catch (error) {
        return { valid: false, error: 'Selector CSS inválido' };
      }
    });

    // Validador de colores
    this.addValidator('color', (color) => {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$|^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)$/;
      return {
        valid: colorRegex.test(color),
        error: 'Formato de color inválido (usa #hex, rgb() o rgba())'
      };
    });

    // Validador de URLs
    this.addValidator('url', (url) => {
      try {
        new URL(url);
        return { valid: true };
      } catch (error) {
        return { valid: false, error: 'URL inválida' };
      }
    });

    // Validador de coordenadas
    this.addValidator('coordinates', (coords) => {
      return {
        valid: Array.isArray(coords) && coords.length === 2 && coords.every(c => typeof c === 'number'),
        error: 'Las coordenadas deben ser un array de dos números [x, y]'
      };
    });
  }

  addCommandSchema(commandType, schema) {
    this.commandSchemas.set(commandType, schema);
  }

  addValidator(name, validatorFn) {
    this.validators.set(name, validatorFn);
  }

  validateCommand(command) {
    const errors = [];
    const warnings = [];

    // Verificar que el comando tiene una acción
    if (!command.action) {
      errors.push('El comando debe tener una propiedad "action"');
      return { valid: false, errors, warnings };
    }

    const schema = this.commandSchemas.get(command.action);
    if (!schema) {
      warnings.push(`Comando "${command.action}" no reconocido, se intentará procesar de todos modos`);
      return { valid: true, errors, warnings };
    }

    // Validar parámetros requeridos
    if (schema.parameters) {
      for (const [paramName, paramSchema] of Object.entries(schema.parameters)) {
        if (paramSchema.required && !(paramName in command)) {
          errors.push(`Parámetro requerido "${paramName}" no encontrado`);
        }

        if (paramName in command) {
          const validation = this.validateParameter(command[paramName], paramSchema, paramName);
          if (!validation.valid) {
            errors.push(validation.error);
          }
        }
      }
    }

    // Aplicar validadores personalizados
    if (command.selector) {
      const selectorValidation = this.validators.get('css_selector')(command.selector);
      if (!selectorValidation.valid) {
        errors.push(`Selector inválido: ${selectorValidation.error}`);
      }
    }

    if (command.color) {
      const colorValidation = this.validators.get('color')(command.color);
      if (!colorValidation.valid) {
        errors.push(`Color inválido: ${colorValidation.error}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  validateParameter(value, schema, paramName) {
    // Validación de tipo
    if (schema.type === 'string' && typeof value !== 'string') {
      return { valid: false, error: `${paramName} debe ser un string` };
    }

    if (schema.type === 'number' && typeof value !== 'number') {
      return { valid: false, error: `${paramName} debe ser un número` };
    }

    if (schema.type === 'boolean' && typeof value !== 'boolean') {
      return { valid: false, error: `${paramName} debe ser un booleano` };
    }

    if (schema.type === 'array' && !Array.isArray(value)) {
      return { valid: false, error: `${paramName} debe ser un array` };
    }

    if (schema.type === 'object' && (typeof value !== 'object' || Array.isArray(value))) {
      return { valid: false, error: `${paramName} debe ser un objeto` };
    }

    // Validaciones específicas
    if (schema.enum && !schema.enum.includes(value)) {
      return { valid: false, error: `${paramName} debe ser uno de: ${schema.enum.join(', ')}` };
    }

    if (schema.min !== undefined && value < schema.min) {
      return { valid: false, error: `${paramName} debe ser al menos ${schema.min}` };
    }

    if (schema.max !== undefined && value > schema.max) {
      return { valid: false, error: `${paramName} debe ser como máximo ${schema.max}` };
    }

    if (schema.maxLength !== undefined && value.length > schema.maxLength) {
      return { valid: false, error: `${paramName} no puede exceder ${schema.maxLength} caracteres` };
    }

    if (schema.length !== undefined && value.length !== schema.length) {
      return { valid: false, error: `${paramName} debe tener exactamente ${schema.length} elementos` };
    }

    if (schema.format === 'url') {
      const urlValidation = this.validators.get('url')(value);
      if (!urlValidation.valid) {
        return { valid: false, error: `${paramName}: ${urlValidation.error}` };
      }
    }

    return { valid: true };
  }

  processCommand(command, context = {}) {
    // Validar comando
    const validation = this.validateCommand(command);
    if (!validation.valid) {
      throw new Error(`Comando inválido: ${validation.errors.join(', ')}`);
    }

    // Aplicar middleware
    let processedCommand = { ...command };
    for (const middleware of this.middleware) {
      processedCommand = middleware(processedCommand, context);
    }

    // Agregar timestamp si no existe
    if (!processedCommand.timestamp) {
      processedCommand.timestamp = Date.now();
    }

    // Generar ID si no existe
    if (!processedCommand.id) {
      processedCommand.id = this.generateCommandId();
    }

    // Guardar en historial
    this.commandHistory.push({
      command: processedCommand,
      context,
      validation,
      timestamp: new Date()
    });

    // Limitar historial
    if (this.commandHistory.length > 1000) {
      this.commandHistory = this.commandHistory.slice(-500);
    }

    return processedCommand;
  }

  addMiddleware(middlewareFn) {
    this.middleware.push(middlewareFn);
  }

  generateCommandId() {
    return 'cmd_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  getCommandSchema(commandType) {
    return this.commandSchemas.get(commandType);
  }

  getAllCommandSchemas() {
    return Object.fromEntries(this.commandSchemas);
  }

  getCommandHistory(limit = 50) {
    return this.commandHistory.slice(-limit);
  }

  // Métodos para plugins
  registerPlugin(name, plugin) {
    if (plugin.commands) {
      plugin.commands.forEach(cmd => this.addCommandSchema(cmd.type, cmd.schema));
    }
    if (plugin.validators) {
      Object.entries(plugin.validators).forEach(([name, validator]) => {
        this.addValidator(name, validator);
      });
    }
    this.plugins.set(name, plugin);
  }

  unregisterPlugin(name) {
    return this.plugins.delete(name);
  }

  // Exportar/importar configuración
  exportConfiguration() {
    return {
      schemas: Object.fromEntries(this.commandSchemas),
      validators: Object.fromEntries(this.validators),
      plugins: Array.from(this.plugins.keys())
    };
  }

  importConfiguration(config) {
    // Implementar importación de configuración
    // Esto permite guardar/cargar configuraciones personalizadas
  }
}

// Middleware de ejemplo
const loggingMiddleware = (command, context) => {
  console.log(`Procesando comando: ${command.action}`, { command, context });
  return command;
};

const securityMiddleware = (command, context) => {
  // Middleware de seguridad para prevenir comandos peligrosos
  const dangerousCommands = ['eval', 'script', 'redirect'];
  if (dangerousCommands.includes(command.action)) {
    throw new Error(`Comando "${command.action}" no permitido por seguridad`);
  }
  return command;
};

module.exports = {
  CommandSystem,
  loggingMiddleware,
  securityMiddleware
};