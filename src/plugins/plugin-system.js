/**
 * Sistema de Plugins para AI Browser Overlay
 * Permite extender la funcionalidad del navegador IA con módulos personalizables
 */

class PluginSystem {
  constructor() {
    this.plugins = new Map();
    this.hooks = new Map();
    this.pluginAPI = new PluginAPI(this);
    this.loadedPlugins = new Set();
    this.pluginConfigs = new Map();

    this.init();
  }

  init() {
    this.setupCoreHooks();
    this.loadDefaultPlugins();
  }

  setupCoreHooks() {
    // Hooks del ciclo de vida del navegador
    this.registerHook('page_load');
    this.registerHook('dom_ready');
    this.registerHook('screenshot_taken');
    this.registerHook('command_received');
    this.registerHook('command_executed');
    this.registerHook('overlay_draw');
    this.registerHook('dom_manipulation');
    this.registerHook('analysis_complete');
    this.registerHook('error_occurred');
  }

  loadDefaultPlugins() {
    // Cargar plugins por defecto
    this.loadPlugin('accessibility', AccessibilityPlugin);
    this.loadPlugin('voice_commands', VoiceCommandsPlugin);
    this.loadPlugin('analytics', AnalyticsPlugin);
    this.loadPlugin('automation', AutomationPlugin);
  }

  registerHook(hookName) {
    if (!this.hooks.has(hookName)) {
      this.hooks.set(hookName, []);
    }
  }

  addHookListener(hookName, listener, priority = 10) {
    if (!this.hooks.has(hookName)) {
      this.registerHook(hookName);
    }

    this.hooks.get(hookName).push({
      listener,
      priority
    });

    // Ordenar por prioridad (menor número = mayor prioridad)
    this.hooks.get(hookName).sort((a, b) => a.priority - b.priority);
  }

  async executeHook(hookName, data = {}) {
    if (!this.hooks.has(hookName)) {
      return data;
    }

    const listeners = this.hooks.get(hookName);
    let result = data;

    for (const { listener } of listeners) {
      try {
        const listenerResult = await listener(result);
        if (listenerResult !== undefined) {
          result = listenerResult;
        }
      } catch (error) {
        console.error(`Error en hook ${hookName}:`, error);
      }
    }

    return result;
  }

  loadPlugin(name, pluginClass) {
    try {
      const plugin = new pluginClass(this.pluginAPI);

      if (this.loadedPlugins.has(name)) {
        console.warn(`Plugin ${name} ya está cargado`);
        return false;
      }

      // Validar plugin
      if (!this.validatePlugin(plugin)) {
        throw new Error(`Plugin ${name} no es válido`);
      }

      // Cargar configuración del plugin
      const config = this.getPluginConfig(name);
      plugin.init(config);

      // Registrar hooks del plugin
      if (plugin.hooks) {
        Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
          this.addHookListener(hookName, handler, plugin.priority || 10);
        });
      }

      // Registrar comandos del plugin
      if (plugin.commands) {
        plugin.commands.forEach(command => {
          this.pluginAPI.registerCommand(command.type, command.handler);
        });
      }

      this.plugins.set(name, plugin);
      this.loadedPlugins.add(name);

      console.log(`Plugin ${name} cargado exitosamente`);
      return true;

    } catch (error) {
      console.error(`Error cargando plugin ${name}:`, error);
      return false;
    }
  }

  unloadPlugin(name) {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      return false;
    }

    try {
      // Ejecutar cleanup del plugin
      if (plugin.cleanup) {
        plugin.cleanup();
      }

      // Remover hooks del plugin
      if (plugin.hooks) {
        Object.keys(plugin.hooks).forEach(hookName => {
          this.removeHookListener(hookName, plugin.hooks[hookName]);
        });
      }

      // Remover comandos del plugin
      if (plugin.commands) {
        plugin.commands.forEach(command => {
          this.pluginAPI.unregisterCommand(command.type);
        });
      }

      this.plugins.delete(name);
      this.loadedPlugins.delete(name);

      console.log(`Plugin ${name} descargado exitosamente`);
      return true;

    } catch (error) {
      console.error(`Error descargando plugin ${name}:`, error);
      return false;
    }
  }

  validatePlugin(plugin) {
    return (
      plugin &&
      typeof plugin.init === 'function' &&
      typeof plugin.name === 'string' &&
      typeof plugin.version === 'string'
    );
  }

  getPlugin(name) {
    return this.plugins.get(name);
  }

  getPluginConfig(name) {
    return this.pluginConfigs.get(name) || {};
  }

  setPluginConfig(name, config) {
    this.pluginConfigs.set(name, config);

    // Aplicar configuración al plugin si está cargado
    const plugin = this.plugins.get(name);
    if (plugin && plugin.updateConfig) {
      plugin.updateConfig(config);
    }
  }

  removeHookListener(hookName, listener) {
    if (!this.hooks.has(hookName)) return;

    const listeners = this.hooks.get(hookName);
    const index = listeners.findIndex(l => l.listener === listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  getAllPlugins() {
    return Array.from(this.plugins.entries()).map(([name, plugin]) => ({
      name,
      version: plugin.version,
      description: plugin.description,
      enabled: plugin.enabled !== false
    }));
  }

  getHooks() {
    return Array.from(this.hooks.keys());
  }
}

class PluginAPI {
  constructor(pluginSystem) {
    this.system = pluginSystem;
  }

  // Registro de hooks
  onHook(hookName, listener, priority) {
    this.system.addHookListener(hookName, listener, priority);
  }

  // Registro de comandos
  registerCommand(commandType, handler) {
    if (!this.system.commandSystem) {
      console.warn('CommandSystem no disponible');
      return;
    }
    this.system.commandSystem.addCommandSchema(commandType, {
      description: `Comando de plugin: ${commandType}`,
      handler
    });
  }

  unregisterCommand(commandType) {
    if (this.system.commandSystem) {
      this.system.commandSystem.commandSchemas.delete(commandType);
    }
  }

  // Utilidades
  log(message, type = 'info') {
    console.log(`[Plugin] ${message}`);
  }

  async executeHook(hookName, data) {
    return await this.system.executeHook(hookName, data);
  }

  // Acceso al navegador
  getBrowserWindow() {
    return this.system.browserWindow;
  }

  sendCommand(command) {
    if (this.system.sendCommand) {
      return this.system.sendCommand(command);
    }
  }

  // Almacenamiento de datos del plugin
  getStorage(pluginName) {
    return new PluginStorage(pluginName);
  }
}

class PluginStorage {
  constructor(pluginName) {
    this.pluginName = pluginName;
    this.storageKey = `plugin_storage_${pluginName}`;
  }

  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(this.storageKey);
      const parsed = JSON.parse(data || '{}');
      return parsed[key] !== undefined ? parsed[key] : defaultValue;
    } catch (error) {
      console.error(`Error getting storage for ${this.pluginName}:`, error);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      const data = localStorage.getItem(this.storageKey);
      const parsed = JSON.parse(data || '{}');
      parsed[key] = value;
      localStorage.setItem(this.storageKey, JSON.stringify(parsed));
    } catch (error) {
      console.error(`Error setting storage for ${this.pluginName}:`, error);
    }
  }

  remove(key) {
    try {
      const data = localStorage.getItem(this.storageKey);
      const parsed = JSON.parse(data || '{}');
      delete parsed[key];
      localStorage.setItem(this.storageKey, JSON.stringify(parsed));
    } catch (error) {
      console.error(`Error removing storage for ${this.pluginName}:`, error);
    }
  }

  clear() {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error(`Error clearing storage for ${this.pluginName}:`, error);
    }
  }
}

// Plugins por defecto

class AccessibilityPlugin {
  constructor(api) {
    this.api = api;
    this.name = 'accessibility';
    this.version = '1.0.0';
    this.description = 'Plugin para análisis y mejoras de accesibilidad';
    this.priority = 5;
  }

  init(config) {
    this.config = {
      autoAnalyze: true,
      showWarnings: true,
      ...config
    };

    this.api.log('Accessibility Plugin inicializado');
  }

  get hooks() {
    return {
      page_load: this.analyzePageAccessibility.bind(this),
      dom_ready: this.checkAccessibilityIssues.bind(this),
      analysis_complete: this.generateAccessibilityReport.bind(this)
    };
  }

  async analyzePageAccessibility(data) {
    if (!this.config.autoAnalyze) return data;

    this.api.log('Analizando accesibilidad de la página...');

    const issues = await this.checkAccessibilityIssues(data);
    if (issues.length > 0 && this.config.showWarnings) {
      this.highlightAccessibilityIssues(issues);
    }

    return { ...data, accessibilityIssues: issues };
  }

  async checkAccessibilityIssues(data) {
    // Simulación de análisis de accesibilidad
    const issues = [];

    // Verificar etiquetas alt en imágenes
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      issues.push({
        type: 'missing_alt',
        severity: 'error',
        count: images.length,
        message: `${images.length} imágenes sin atributo alt`
      });
    }

    // Verificar contraste de color
    const lowContrastElements = document.querySelectorAll('*');
    // Simulación: suponemos que encontramos elementos con bajo contraste
    if (lowContrastElements.length > 0) {
      issues.push({
        type: 'low_contrast',
        severity: 'warning',
        count: 5,
        message: 'Elementos con bajo contraste de color'
      });
    }

    // Verificar estructura de encabezados
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      issues.push({
        type: 'no_headings',
        severity: 'error',
        count: 1,
        message: 'La página no tiene estructura de encabezados'
      });
    }

    return issues;
  }

  highlightAccessibilityIssues(issues) {
    issues.forEach(issue => {
      switch (issue.type) {
        case 'missing_alt':
          this.api.sendCommand({
            action: 'highlight',
            selector: 'img:not([alt])',
            style: {
              outline: '3px solid #ff5722',
              boxShadow: '0 0 10px rgba(255, 87, 34, 0.5)'
            }
          });
          break;
        case 'low_contrast':
          this.api.sendCommand({
            action: 'text',
            text: '⚠️ Bajo contraste',
            position: [10, 10],
            color: '#ff5722',
            backgroundColor: 'rgba(255, 87, 34, 0.9)'
          });
          break;
      }
    });
  }

  generateAccessibilityReport(data) {
    const report = {
      score: this.calculateAccessibilityScore(data.accessibilityIssues || []),
      issues: data.accessibilityIssues || [],
      recommendations: this.generateRecommendations(data.accessibilityIssues || [])
    };

    this.api.sendCommand({
      action: 'text',
      text: `Accesibilidad: ${report.score}/10`,
      position: [10, 50],
      color: report.score >= 8 ? '#4caf50' : report.score >= 5 ? '#ff9800' : '#f44336',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      fontSize: 14
    });

    return { ...data, accessibilityReport: report };
  }

  calculateAccessibilityScore(issues) {
    let score = 10;
    issues.forEach(issue => {
      if (issue.severity === 'error') score -= 2;
      else if (issue.severity === 'warning') score -= 1;
    });
    return Math.max(0, score);
  }

  generateRecommendations(issues) {
    const recommendations = [];

    if (issues.some(i => i.type === 'missing_alt')) {
      recommendations.push('Añade atributos alt descriptivos a todas las imágenes');
    }

    if (issues.some(i => i.type === 'low_contrast')) {
      recommendations.push('Mejora el contraste de color para mejor legibilidad');
    }

    if (issues.some(i => i.type === 'no_headings')) {
      recommendations.push('Añade una estructura de encabezados jerárquica');
    }

    return recommendations;
  }
}

class VoiceCommandsPlugin {
  constructor(api) {
    this.api = api;
    this.name = 'voice_commands';
    this.version = '1.0.0';
    this.description = 'Plugin para comandos de voz';
    this.priority = 8;
    this.recognition = null;
  }

  init(config) {
    this.config = {
      language: 'es-ES',
      continuous: true,
      interimResults: false,
      ...config
    };

    this.setupVoiceRecognition();
    this.api.log('Voice Commands Plugin inicializado');
  }

  setupVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      this.api.log('Reconocimiento de voz no soportado', 'error');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();

    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;

    this.recognition.onresult = (event) => {
      const last = event.results.length - 1;
      const command = event.results[last][0].transcript.toLowerCase();
      this.processVoiceCommand(command);
    };

    this.recognition.onerror = (event) => {
      this.api.log(`Error en reconocimiento de voz: ${event.error}`, 'error');
    };

    this.recognition.start();
  }

  processVoiceCommand(command) {
    this.api.log(`Comando de voz: ${command}`);

    // Procesar comandos comunes
    if (command.includes('buscar') || command.includes('search')) {
      const searchTerm = command.replace(/buscar|search/gi, '').trim();
      this.api.sendCommand({
        action: 'navigate',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`
      });
    } else if (command.includes('capturar') || command.includes('captura')) {
      this.api.sendCommand({ action: 'capture' });
    } else if (command.includes('limpiar') || command.includes('borrar')) {
      this.api.sendCommand({ action: 'clear' });
    } else if (command.includes('analizar') || command.includes('análisis')) {
      this.api.sendCommand({ action: 'get_dom' });
    }
  }

  cleanup() {
    if (this.recognition) {
      this.recognition.stop();
    }
  }
}

class AnalyticsPlugin {
  constructor(api) {
    this.api = api;
    this.name = 'analytics';
    this.version = '1.0.0';
    this.description = 'Plugin para análisis de uso y métricas';
    this.priority = 15;
    this.metrics = {
      commands: 0,
      pages: 0,
      analyses: 0,
      errors: 0
    };
  }

  init(config) {
    this.config = {
      trackCommands: true,
      trackPages: true,
      trackErrors: true,
      ...config
    };

    this.loadStoredMetrics();
    this.api.log('Analytics Plugin inicializado');
  }

  get hooks() {
    return {
      command_executed: this.trackCommand.bind(this),
      page_load: this.trackPage.bind(this),
      analysis_complete: this.trackAnalysis.bind(this),
      error_occurred: this.trackError.bind(this)
    };
  }

  trackCommand(data) {
    if (!this.config.trackCommands) return data;

    this.metrics.commands++;
    this.saveMetrics();
    return data;
  }

  trackPage(data) {
    if (!this.config.trackPages) return data;

    this.metrics.pages++;
    this.saveMetrics();
    return data;
  }

  trackAnalysis(data) {
    if (!this.config.trackAnalyses) return data;

    this.metrics.analyses++;
    this.saveMetrics();
    return data;
  }

  trackError(data) {
    if (!this.config.trackErrors) return data;

    this.metrics.errors++;
    this.saveMetrics();
    return data;
  }

  loadStoredMetrics() {
    const stored = this.api.getStorage(this.name).get('metrics');
    if (stored) {
      this.metrics = { ...this.metrics, ...stored };
    }
  }

  saveMetrics() {
    this.api.getStorage(this.name).set('metrics', this.metrics);
  }

  getMetrics() {
    return { ...this.metrics };
  }

  resetMetrics() {
    this.metrics = {
      commands: 0,
      pages: 0,
      analyses: 0,
      errors: 0
    };
    this.saveMetrics();
  }
}

class AutomationPlugin {
  constructor(api) {
    this.api = api;
    this.name = 'automation';
    this.version = '1.0.0';
    this.description = 'Plugin para automatización de tareas';
    this.priority = 12;
    this.automations = [];
  }

  init(config) {
    this.config = {
      enabledAutomations: ['form_filler', 'login_assistant', 'navigation_helper'],
      ...config
    };

    this.setupAutomations();
    this.api.log('Automation Plugin inicializado');
  }

  setupAutomations() {
    if (this.config.enabledAutomations.includes('form_filler')) {
      this.setupFormFiller();
    }

    if (this.config.enabledAutomations.includes('login_assistant')) {
      this.setupLoginAssistant();
    }
  }

  setupFormFiller() {
    // Automatización para rellenar formularios
    this.addHookListener('dom_ready', (data) => {
      const forms = document.querySelectorAll('form');
      if (forms.length > 0) {
        this.api.sendCommand({
          action: 'text',
          text: '📝 Formularios detectados',
          position: [10, 100],
          color: '#2196f3',
          backgroundColor: 'rgba(33, 150, 243, 0.9)'
        });

        // Resaltar campos importantes
        this.api.sendCommand({
          action: 'highlight',
          selector: 'form input[required], form select[required], form textarea[required]',
          style: {
            outline: '2px solid #2196f3',
            boxShadow: '0 0 8px rgba(33, 150, 243, 0.3)'
          }
        });
      }
      return data;
    });
  }

  setupLoginAssistant() {
    // Asistente de inicio de sesión
    this.addHookListener('page_load', (data) => {
      if (data.url && data.url.includes('login') || data.url.includes('signin')) {
        this.api.sendCommand({
          action: 'text',
          text: '🔐 Página de inicio de sesión detectada',
          position: [10, 150],
          color: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.9)'
        });

        // Resaltar campos de login
        this.api.sendCommand({
          action: 'highlight',
          selector: 'input[type="email"], input[type="password"], input[name*="user"], input[name*="login"]',
          style: {
            outline: '3px solid #4caf50',
            boxShadow: '0 0 12px rgba(76, 175, 80, 0.5)'
          }
        });
      }
      return data;
    });
  }

  addHookListener(hookName, listener) {
    this.api.onHook(hookName, listener);
  }

  addAutomation(name, automation) {
    this.automations.push({ name, ...automation });
  }

  removeAutomation(name) {
    this.automations = this.automations.filter(a => a.name !== name);
  }

  getAutomations() {
    return [...this.automations];
  }
}

module.exports = {
  PluginSystem,
  PluginAPI,
  PluginStorage,
  AccessibilityPlugin,
  VoiceCommandsPlugin,
  AnalyticsPlugin,
  AutomationPlugin
};