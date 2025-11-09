const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al renderer
contextBridge.exposeInMainWorld('electronAPI', {
  // Navegación y página
  getBrowserInfo: () => ipcRenderer.invoke('get-browser-info'),
  requestScreenshot: () => ipcRenderer.invoke('request-screenshot'),
  requestDOMAnalysis: () => ipcRenderer.invoke('request-dom-analysis'),

  // Comunicación con IA
  sendToAI: (data) => ipcRenderer.send('to-ai', data),
  onAICommand: (callback) => ipcRenderer.on('ai-command', callback),

  // Manipulación DOM
  executeDOMCommand: (command) => ipcRenderer.invoke('execute-dom-command', command),

  // Notificaciones
  onNavigate: (callback) => ipcRenderer.on('navigated', callback),
  onTitleChange: (callback) => ipcRenderer.on('title-changed', callback),

  // Utilidades
  log: (...args) => console.log('[Renderer]', ...args),
});

// Sistema de manipulación DOM inyectado
class DOMManipulator {
  constructor() {
    this.injectedStyles = new Map();
    this.injectedElements = new Map();
    this.originalStyles = new Map();
    this.observer = null;
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupMutationObserver();
  }

  setupEventListeners() {
    // Escuchar comandos desde el proceso principal
    if (window.electronAPI) {
      window.electronAPI.onAICommand((event, command) => {
        if (command.type === 'dom_manipulation') {
          this.handleCommand(command.command);
        }
      });
    }

    // Escuchar comandos directos si se inyecta como script
    window.addEventListener('message', (event) => {
      if (event.data.type === 'AI_DOM_COMMAND') {
        this.handleCommand(event.data.command);
      }
    });
  }

  setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Notificar cambios en el DOM a la IA
          this.notifyDOMChange(mutation);
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeOldValue: true
    });
  }

  handleCommand(command) {
    console.log('DOM Manipulator recibió comando:', command);

    switch (command.action) {
      case 'highlight':
        this.highlightElement(command.selector, command.style, command.options);
        break;
      case 'unhighlight':
        this.unhighlightElement(command.selector);
        break;
      case 'hide':
        this.hideElement(command.selector);
        break;
      case 'show':
        this.showElement(command.selector);
        break;
      case 'modify_style':
        this.modifyStyle(command.selector, command.styles);
        break;
      case 'modify_text':
        this.modifyText(command.selector, command.text);
        break;
      case 'modify_attribute':
        this.modifyAttribute(command.selector, command.attribute, command.value);
        break;
      case 'inject_element':
        this.injectElement(command.selector, command.element, command.position);
        break;
      case 'remove_element':
        this.removeElement(command.selector);
        break;
      case 'click_element':
        this.clickElement(command.selector);
        break;
      case 'scroll_to':
        this.scrollTo(command.selector, command.options);
        break;
      case 'get_element_info':
        this.getElementInfo(command.selector);
        break;
      case 'clear_all':
        this.clearAllManipulations();
        break;
      default:
        console.warn('Comando DOM no reconocido:', command.action);
    }
  }

  highlightElement(selector, style, options = {}) {
    const elements = document.querySelectorAll(selector);
    if (elements.length === 0) return;

    const defaultStyle = {
      outline: '3px solid #ff4081',
      outlineOffset: '2px',
      borderRadius: '4px',
      boxShadow: '0 0 10px rgba(255, 64, 129, 0.5)',
      transition: 'all 0.3s ease',
      position: 'relative'
    };

    const finalStyle = { ...defaultStyle, ...style };

    elements.forEach((element, index) => {
      const elementId = `${selector}_${index}`;

      // Guardar estilos originales
      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, {
          style: element.getAttribute('style'),
          className: element.className
        });
      }

      // Aplicar estilos de resaltado
      Object.keys(finalStyle).forEach(property => {
        element.style[property] = finalStyle[property];
      });

      // Añadir indicador visual
      if (options.addIndicator) {
        const indicator = document.createElement('div');
        indicator.className = 'ai-highlight-indicator';
        indicator.style.cssText = `
          position: absolute;
          top: -10px;
          right: -10px;
          background: #ff4081;
          color: white;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          z-index: 10000;
          pointer-events: none;
        `;
        indicator.textContent = '✓';
        element.style.position = 'relative';
        element.appendChild(indicator);
        this.injectedElements.set(elementId, indicator);
      }

      this.injectedStyles.set(elementId, finalStyle);
    });

    // Enviar información de vuelta a la IA
    this.sendToAI({
      type: 'element_highlighted',
      selector: selector,
      count: elements.length,
      elements: Array.from(elements).map(el => ({
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        text: el.textContent?.substring(0, 50)
      }))
    });
  }

  unhighlightElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      // Restaurar estilos originales
      const original = this.originalStyles.get(element);
      if (original) {
        element.setAttribute('style', original.style || '');
        element.className = original.className || '';
      }

      // Remover indicadores
      const indicators = element.querySelectorAll('.ai-highlight-indicator');
      indicators.forEach(indicator => indicator.remove());
    });

    // Limpiar registros
    this.injectedStyles.forEach((style, key) => {
      if (key.startsWith(selector)) {
        this.injectedStyles.delete(key);
      }
    });
  }

  hideElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const elementId = `hide_${selector}_${index}`;

      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, {
          display: element.style.display,
          visibility: element.style.visibility
        });
      }

      element.style.display = 'none';
      this.injectedStyles.set(elementId, { display: 'none' });
    });
  }

  showElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      const original = this.originalStyles.get(element);
      if (original) {
        element.style.display = original.display || '';
        element.style.visibility = original.visibility || '';
      }
    });

    // Limpiar registros de ocultación
    this.injectedStyles.forEach((style, key) => {
      if (key.startsWith(`hide_${selector}`)) {
        this.injectedStyles.delete(key);
      }
    });
  }

  modifyStyle(selector, styles) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const elementId = `style_${selector}_${index}`;

      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, {
          style: element.getAttribute('style')
        });
      }

      Object.keys(styles).forEach(property => {
        element.style[property] = styles[property];
      });

      this.injectedStyles.set(elementId, styles);
    });
  }

  modifyText(selector, text) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, {
          textContent: element.textContent
        });
      }
      element.textContent = text;
    });
  }

  modifyAttribute(selector, attribute, value) {
    const elements = document.querySelectorAll(selector);
    elements.forEach((element, index) => {
      const elementId = `attr_${selector}_${index}`;

      if (!this.originalStyles.has(element)) {
        this.originalStyles.set(element, {
          [attribute]: element.getAttribute(attribute)
        });
      }

      if (value === null) {
        element.removeAttribute(attribute);
      } else {
        element.setAttribute(attribute, value);
      }

      this.injectedStyles.set(elementId, { attribute, value });
    });
  }

  injectElement(selector, elementConfig, position = 'beforeend') {
    const target = document.querySelector(selector);
    if (!target) return;

    const element = document.createElement(elementConfig.tag);

    // Configurar atributos
    if (elementConfig.attributes) {
      Object.keys(elementConfig.attributes).forEach(attr => {
        element.setAttribute(attr, elementConfig.attributes[attr]);
      });
    }

    // Configurar estilos
    if (elementConfig.style) {
      Object.keys(elementConfig.style).forEach(prop => {
        element.style[prop] = elementConfig.style[prop];
      });
    }

    // Configurar contenido
    if (elementConfig.html) {
      element.innerHTML = elementConfig.html;
    } else if (elementConfig.text) {
      element.textContent = elementConfig.text;
    }

    // Inyectar elemento
    target.insertAdjacentElement(position, element);

    const elementId = `injected_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.injectedElements.set(elementId, element);

    return elementId;
  }

  removeElement(selector) {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      this.originalStyles.delete(element);
      element.remove();
    });
  }

  clickElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.click();

      // Enviar feedback a la IA
      this.sendToAI({
        type: 'element_clicked',
        selector: selector,
        element: this.getElementData(element)
      });
    }
  }

  scrollTo(selector, options = {}) {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({
        behavior: options.behavior || 'smooth',
        block: options.block || 'center',
        inline: options.inline || 'center'
      });

      // Resaltar temporalmente después de hacer scroll
      if (options.highlightAfterScroll) {
        setTimeout(() => {
          this.highlightElement(selector, {
            boxShadow: '0 0 20px rgba(76, 175, 80, 0.8)',
            outline: '3px solid #4caf50'
          }, { addIndicator: true });

          // Quitar resaltado después de un tiempo
          setTimeout(() => {
            this.unhighlightElement(selector);
          }, options.highlightDuration || 3000);
        }, options.scrollDelay || 1000);
      }
    }
  }

  getElementInfo(selector) {
    const element = document.querySelector(selector);
    if (element) {
      const info = this.getElementData(element);

      this.sendToAI({
        type: 'element_info',
        selector: selector,
        data: info
      });

      return info;
    }
  }

  getElementData(element) {
    const rect = element.getBoundingClientRect();
    return {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 200),
      innerHTML: element.innerHTML?.substring(0, 500),
      attributes: Array.from(element.attributes).map(attr => ({
        name: attr.name,
        value: attr.value
      })),
      boundingBox: {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height
      },
      computedStyle: {
        display: window.getComputedStyle(element).display,
        visibility: window.getComputedStyle(element).visibility,
        position: window.getComputedStyle(element).position
      }
    };
  }

  clearAllManipulations() {
    // Restaurar todos los estilos originales
    this.originalStyles.forEach((original, element) => {
      if (element && element.parentNode) {
        element.setAttribute('style', original.style || '');
        element.className = original.className || '';
        if (original.textContent !== undefined) {
          element.textContent = original.textContent;
        }
      }
    });

    // Remover todos los elementos inyectados
    this.injectedElements.forEach((element) => {
      if (element && element.parentNode) {
        element.remove();
      }
    });

    // Limpiar registros
    this.originalStyles.clear();
    this.injectedStyles.clear();
    this.injectedElements.clear();

    // Enviar confirmación
    this.sendToAI({
      type: 'all_manipulations_cleared',
      timestamp: Date.now()
    });
  }

  notifyDOMChange(mutation) {
    this.sendToAI({
      type: 'dom_changed',
      mutation: {
        type: mutation.type,
        target: this.getElementData(mutation.target),
        addedNodes: Array.from(mutation.addedNodes).map(node =>
          node.nodeType === Node.ELEMENT_NODE ? this.getElementData(node) : null
        ).filter(Boolean)
      },
      timestamp: Date.now()
    });
  }

  sendToAI(data) {
    if (window.electronAPI) {
      window.electronAPI.sendToAI(data);
    } else {
      // Para pruebas, enviar a la consola
      console.log('Para enviar a IA:', data);
    }
  }
}

// Inicializar el manipulador DOM
let domManipulator;

// Esperar a que el DOM esté cargado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    domManipulator = new DOMManipulator();
    window.domManipulator = domManipulator;
  });
} else {
  domManipulator = new DOMManipulator();
  window.domManipulator = domManipulator;
}

// Exponer funciones globales para facilitar pruebas
window.aidom = {
  highlight: (selector, style, options) => domManipulator?.highlightElement(selector, style, options),
  unhighlight: (selector) => domManipulator?.unhighlightElement(selector),
  hide: (selector) => domManipulator?.hideElement(selector),
  show: (selector) => domManipulator?.showElement(selector),
  modifyStyle: (selector, styles) => domManipulator?.modifyStyle(selector, styles),
  clear: () => domManipulator?.clearAllManipulations()
};