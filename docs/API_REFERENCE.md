# API Reference - AI Browser Overlay

## Tabla de Contenidos

- [Comandos JSON](#comandos-json)
- [Eventos WebSocket](#eventos-websocket)
- [API REST](#api-rest)
- [Plugins](#plugins)
- [Ejemplos de Código](#ejemplos-de-código)

## Comandos JSON

### Estructura Base

Todos los comandos siguen esta estructura básica:

```json
{
  "action": "tipo_de_accion",
  "id": "identificador_unico_opcional",
  "timestamp": 1234567890,
  // ... parámetros específicos del comando
}
```

### Comandos de Dibujo (Overlay)

#### arrow
Dibuja una flecha entre dos puntos.

```json
{
  "action": "arrow",
  "from": [x1, y1],
  "to": [x2, y2],
  "color": "#ff4081",
  "width": 2,
  "style": "solid|dashed",
  "animated": false,
  "id": "arrow_001"
}
```

**Parámetros:**
- `from` (array, requerido): Coordenadas de inicio [x, y]
- `to` (array, requerido): Coordenadas de fin [x, y]
- `color` (string, opcional): Color en formato hexadecimal
- `width` (number, opcional): Grosor de la línea (default: 2)
- `style` (string, opcional): "solid" o "dashed" (default: "solid")
- `animated` (boolean, opcional): Si la flecha debe animarse (default: false)

#### circle
Dibuja un círculo.

```json
{
  "action": "circle",
  "center": [x, y],
  "radius": 50,
  "color": "#4caf50",
  "fill": false,
  "fillColor": "rgba(76, 175, 80, 0.2)",
  "width": 2,
  "id": "circle_001"
}
```

**Parámetros:**
- `center` (array, requerido): Centro del círculo [x, y]
- `radius` (number, requerido): Radio del círculo
- `color` (string, opcional): Color del borde
- `fill` (boolean, opcional): Si debe rellenarse (default: false)
- `fillColor` (string, opcional): Color de relleno
- `width` (number, opcional): Grosor del borde (default: 2)

#### rectangle
Dibuja un rectángulo.

```json
{
  "action": "rectangle",
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 150,
  "color": "#2196f3",
  "fill": false,
  "fillColor": "rgba(33, 150, 243, 0.2)",
  "borderRadius": 0,
  "id": "rect_001"
}
```

**Parámetros:**
- `x` (number, requerido): Posición X
- `y` (number, requerido): Posición Y
- `width` (number, requerido): Ancho
- `height` (number, requerido): Alto
- `color` (string, opcional): Color del borde
- `fill` (boolean, opcional): Si debe rellenarse
- `fillColor` (string, opcional): Color de relleno
- `borderRadius` (number, opcional): Radio de las esquinas (default: 0)

#### text
Añade texto al overlay.

```json
{
  "action": "text",
  "text": "Texto informativo",
  "position": [x, y],
  "color": "#ffffff",
  "fontSize": 16,
  "fontFamily": "Arial, sans-serif",
  "backgroundColor": "rgba(33, 33, 33, 0.9)",
  "padding": 8,
  "borderRadius": 4,
  "id": "text_001"
}
```

**Parámetros:**
- `text` (string, requerido): Texto a mostrar (máximo 200 caracteres)
- `position` (array, requerido): Posición [x, y]
- `color` (string, opcional): Color del texto
- `fontSize` (number, opcional): Tamaño de fuente (8-72, default: 16)
- `fontFamily` (string, opcional): Fuente (default: "Arial, sans-serif")
- `backgroundColor` (string, opcional): Color de fondo
- `padding` (number, opcional): Padding interno (default: 8)
- `borderRadius` (number, opcional): Radio de esquinas (default: 4)

### Comandos de Manipulación DOM

#### highlight
Resalta elementos usando selectores CSS.

```json
{
  "action": "highlight",
  "selector": "button.btn-primary",
  "style": {
    "outline": "3px solid #ff4081",
    "boxShadow": "0 0 15px rgba(255, 64, 129, 0.5)"
  },
  "options": {
    "addIndicator": true
  },
  "id": "highlight_001"
}
```

**Parámetros:**
- `selector` (string, requerido): Selector CSS válido
- `style` (object, opcional): Estilos CSS a aplicar
- `options` (object, opcional): Opciones adicionales
  - `addIndicator` (boolean): Añadir indicador visual

#### modify_style
Modifica estilos de elementos.

```json
{
  "action": "modify_style",
  "selector": ".header",
  "styles": {
    "backgroundColor": "#f0f0f0",
    "border": "2px solid #2196f3",
    "fontSize": "18px"
  },
  "id": "style_001"
}
```

**Parámetros:**
- `selector` (string, requerido): Selector CSS
- `styles` (object, requerido): Objeto con estilos CSS

#### hide / show
Oculta o muestra elementos.

```json
{
  "action": "hide",
  "selector": ".advertisement",
  "id": "hide_001"
}

{
  "action": "show",
  "selector": ".advertisement",
  "id": "show_001"
}
```

#### click_element
Simula un clic en un elemento.

```json
{
  "action": "click_element",
  "selector": "button[type='submit']",
  "id": "click_001"
}
```

#### scroll_to
Hace scroll a un elemento específico.

```json
{
  "action": "scroll_to",
  "selector": "#main-content",
  "options": {
    "behavior": "smooth",
    "block": "center",
    "inline": "center",
    "highlightAfterScroll": true,
    "scrollDelay": 1000,
    "highlightDuration": 3000
  },
  "id": "scroll_001"
}
```

**Parámetros:**
- `selector` (string, requerido): Selector CSS del elemento
- `options` (object, opcional): Opciones de scroll
  - `behavior` (string): "smooth" o "auto"
  - `block` (string): "start", "center", "end", "nearest"
  - `inline` (string): "start", "center", "end", "nearest"
  - `highlightAfterScroll` (boolean): Resaltar después del scroll
  - `scrollDelay` (number): Retraso antes de resaltar (ms)
  - `highlightDuration` (number): Duración del resaltado (ms)

### Comandos de Navegación

#### navigate
Navega a una URL específica.

```json
{
  "action": "navigate",
  "url": "https://example.com",
  "id": "nav_001"
}
```

**Parámetros:**
- `url` (string, requerido): URL válida

### Comandos de Análisis

#### capture
Captura la pantalla actual.

```json
{
  "action": "capture",
  "format": "png",
  "quality": 0.9,
  "id": "capture_001"
}
```

**Parámetros:**
- `format` (string, opcional): "png" o "jpeg" (default: "png")
- `quality` (number, opcional): Calidad para JPEG (0.1-1.0, default: 0.9)

#### get_dom
Obtiene y analiza la estructura DOM.

```json
{
  "action": "get_dom",
  "includeText": true,
  "includeStyles": false,
  "maxDepth": 10,
  "id": "dom_001"
}
```

**Parámetros:**
- `includeText` (boolean, opcional): Incluir texto de elementos
- `includeStyles` (boolean, opcional): Incluir estilos computados
- `maxDepth` (number, opcional): Profundidad máxima de análisis (default: 10)

### Comandos de Control

#### clear
Limpia elementos del overlay o DOM.

```json
{
  "action": "clear",
  "type": "overlay|dom|all",
  "id": "clear_001"
}
```

**Parámetros:**
- `type` (string, opcional): "overlay", "dom", o "all" (default: "all")

#### clear_element
Elimina un elemento específico por ID.

```json
{
  "action": "clear_element",
  "id": "element_id_to_remove"
}
```

**Parámetros:**
- `id` (string, requerido): ID del elemento a eliminar

## Eventos WebSocket

### Mensajes del Navegador al Servidor

#### browser_ready
```json
{
  "type": "browser_ready",
  "config": {
    "width": 1400,
    "height": 900,
    "overlayOpacity": 0.3
  }
}
```

#### screenshot
```json
{
  "type": "screenshot",
  "data": "base64_image_data",
  "url": "https://current-page.com",
  "timestamp": 1234567890
}
```

#### dom_data
```json
{
  "type": "dom_data",
  "data": {
    "url": "https://current-page.com",
    "title": "Page Title",
    "html": "<html>...</html>",
    "textContent": "Page text content",
    "elements": [
      {
        "tagName": "BUTTON",
        "id": "submit-btn",
        "className": "btn btn-primary",
        "text": "Submit",
        "boundingBox": { "x": 100, "y": 200, "width": 120, "height": 40 }
      }
    ]
  },
  "timestamp": 1234567890
}
```

#### page_navigated
```json
{
  "type": "page_navigated",
  "url": "https://new-page.com",
  "timestamp": 1234567890
}
```

### Mensajes del Servidor al Navegador

Los comandos JSON se envían directamente como mensajes WebSocket.

#### Mensajes de estado
```json
{
  "type": "status",
  "connected": true,
  "message": "Servidor IA conectado"
}
```

## API REST

### GET /api/status
Obtiene el estado del servidor.

**Response:**
```json
{
  "status": "running",
  "clients": 2,
  "browserConnected": true,
  "models": ["layout_analyzer", "accessibility_checker"],
  "uptime": 3600
}
```

### POST /api/command
Envía un comando al navegador.

**Request:**
```json
{
  "action": "highlight",
  "selector": "button",
  "style": { "outline": "2px solid red" }
}
```

**Response:**
```json
{
  "status": "received",
  "commandId": "cmd_1234567890_abc123"
}
```

### GET /api/history
Obtiene el historial de comandos.

**Response:**
```json
{
  "commands": [
    {
      "timestamp": "2023-01-01T12:00:00Z",
      "command": { "action": "highlight", "selector": "button" },
      "result": "success"
    }
  ],
  "total": 1
}
```

### POST /api/analyze
Analiza una imagen con IA.

**Request:**
```json
{
  "image": "base64_image_data",
  "prompt": "Describe los elementos interactivos en esta imagen"
}
```

**Response:**
```json
{
  "analysis": {
    "description": "Página web con formulario de login",
    "elements": [
      { "type": "input", "label": "Email" },
      { "type": "button", "text": "Login" }
    ],
    "confidence": 0.92
  }
}
```

## Plugins

### Crear un Plugin

```javascript
class MiPlugin {
  constructor(api) {
    this.api = api;
    this.name = 'mi-plugin';
    this.version = '1.0.0';
    this.description = 'Descripción del plugin';
    this.priority = 10; // Prioridad de hooks
  }

  init(config) {
    // Inicialización del plugin
    this.config = config;
    this.api.log(`${this.name} v${this.version} inicializado`);
  }

  // Definir hooks del plugin
  get hooks() {
    return {
      page_load: this.onPageLoad.bind(this),
      command_executed: this.onCommandExecuted.bind(this)
    };
  }

  onPageLoad(data) {
    // Lógica cuando se carga una página
    this.api.log('Página cargada', 'info');
    return data;
  }

  onCommandExecuted(data) {
    // Lógica cuando se ejecuta un comando
    this.api.log(`Comando ejecutado: ${data.command.action}`, 'info');
    return data;
  }

  // Comandos personalizados del plugin
  get commands() {
    return [
      {
        type: 'mi_comando',
        handler: this.handleMiComando.bind(this)
      }
    ];
  }

  handleMiComando(command) {
    // Lógica del comando personalizado
    this.api.log('Mi comando ejecutado', 'success');
  }

  // Limpieza cuando se desactiva el plugin
  cleanup() {
    this.api.log(`${this.name} limpiado`, 'info');
  }
}
```

### API del Plugin

#### api.log(message, type)
Registra un mensaje en la consola.

```javascript
this.api.log('Mensaje informativo', 'info');
this.api.log('Mensaje de éxito', 'success');
this.api.log('Mensaje de error', 'error');
```

#### api.onHook(hookName, listener, priority)
Registra un listener para un hook.

```javascript
this.api.onHook('page_load', (data) => {
  console.log('Página cargada:', data.url);
  return data;
}, 5); // Prioridad 5
```

#### api.sendCommand(command)
Envía un comando al navegador.

```javascript
this.api.sendCommand({
  action: 'highlight',
  selector: '.important-element',
  style: { outline: '2px solid blue' }
});
```

#### api.getStorage(pluginName)
Obtiene almacenamiento persistente para el plugin.

```javascript
const storage = this.api.getStorage('mi-plugin');
storage.set('configuracion', { valor: true });
const config = storage.get('configuracion', {});
```

## Ejemplos de Código

### Tutorial Interactivo

```javascript
// Serie de comandos para un tutorial paso a paso
const tutorialCommands = [
  {
    action: 'text',
    text: '👋 ¡Bienvenido al tutorial!',
    position: [100, 50],
    color: '#ffffff',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    fontSize: 20
  },
  {
    action: 'arrow',
    from: [200, 100],
    to: [400, 300],
    color: '#4caf50',
    animated: true
  },
  {
    action: 'highlight',
    selector: '#tutorial-button',
    style: {
      outline: '3px solid #4caf50',
      boxShadow: '0 0 20px rgba(76, 175, 80, 0.6)'
    },
    options: { addIndicator: true }
  },
  {
    action: 'text',
    text: '1. Haga clic aquí para comenzar',
    position: [350, 250],
    color: '#4caf50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    fontSize: 16
  }
];

// Enviar comandos secuencialmente
tutorialCommands.forEach((cmd, index) => {
  setTimeout(() => {
    sendCommand(cmd);
  }, index * 1500); // 1.5 segundos entre comandos
});
```

### Asistente de Formularios

```javascript
// Detectar y asistir con formularios
const formAssistant = {
  detectForms() {
    return sendCommand({ action: 'get_dom' })
      .then(domData => {
        const forms = domData.data.elements.filter(el => el.tagName === 'FORM');
        return forms;
      });
  },

  highlightRequiredFields(forms) {
    forms.forEach(form => {
      const requiredFields = form.elements.filter(el =>
        el.required || el.attributes.required
      );

      requiredFields.forEach(field => {
        sendCommand({
          action: 'highlight',
          selector: `#${field.id || field.className}`,
          style: {
            outline: '2px solid #ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)'
          }
        });
      });
    });
  },

  addFieldLabels(forms) {
    forms.forEach(form => {
      const fields = form.elements.filter(el =>
        ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
      );

      fields.forEach(field => {
        if (!field.attributes.placeholder && !field.labels.length) {
          const rect = field.boundingBox;
          sendCommand({
            action: 'text',
            text: '📝 Campo requerido',
            position: [rect.x, rect.y - 20],
            color: '#ff9800',
            fontSize: 12
          });
        }
      });
    });
  }
};

// Usar el asistente
formAssistant.detectForms()
  .then(forms => {
    formAssistant.highlightRequiredFields(forms);
    formAssistant.addFieldLabels(forms);
  });
```

### Análisis de Accesibilidad

```javascript
const accessibilityChecker = {
  async checkAccessibility() {
    // Capturar pantalla
    await sendCommand({ action: 'capture' });

    // Obtener DOM
    const domData = await sendCommand({ action: 'get_dom' });

    // Analizar problemas
    const issues = this.findAccessibilityIssues(domData.data);

    // Mostrar resultados
    this.displayAccessibilityResults(issues);
  },

  findAccessibilityIssues(domData) {
    const issues = [];

    // Verificar imágenes sin alt
    const imagesWithoutAlt = domData.elements.filter(el =>
      el.tagName === 'IMG' && !el.attributes.alt
    );

    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: 'missing_alt',
        severity: 'error',
        count: imagesWithoutAlt.length,
        selector: 'img:not([alt])'
      });
    }

    // Verificar enlaces sin texto descriptivo
    const linksWithoutText = domData.elements.filter(el =>
      el.tagName === 'A' && (!el.textContent || el.textContent.trim() === '')
    );

    if (linksWithoutText.length > 0) {
      issues.push({
        type: 'empty_links',
        severity: 'warning',
        count: linksWithoutText.length,
        selector: 'a:not([aria-label]):empty'
      });
    }

    return issues;
  },

  displayAccessibilityResults(issues) {
    const score = this.calculateAccessibilityScore(issues);
    const color = score >= 8 ? '#4caf50' : score >= 6 ? '#ff9800' : '#f44336';

    // Mostrar puntuación
    sendCommand({
      action: 'text',
      text: `♿ Accesibilidad: ${score}/10`,
      position: [10, 10],
      color: '#ffffff',
      backgroundColor: color,
      fontSize: 16
    });

    // Resaltar problemas
    issues.forEach(issue => {
      const issueColor = issue.severity === 'error' ? '#f44336' : '#ff9800';

      sendCommand({
        action: 'highlight',
        selector: issue.selector,
        style: {
          outline: `2px solid ${issueColor}`,
          backgroundColor: `${issueColor}20`
        }
      });

      sendCommand({
        action: 'text',
        text: `${issue.severity === 'error' ? '❌' : '⚠️'} ${issue.type}`,
        position: [10, 60 + issues.indexOf(issue) * 30],
        color: issueColor,
        fontSize: 12
      });
    });
  },

  calculateAccessibilityScore(issues) {
    let score = 10;
    issues.forEach(issue => {
      if (issue.severity === 'error') score -= 2;
      else if (issue.severity === 'warning') score -= 1;
    });
    return Math.max(0, score);
  }
};

// Ejecutar análisis
accessibilityChecker.checkAccessibility();
```

### Automatización de Testing

```javascript
const testAutomation = {
  async runTestSuite() {
    const tests = [
      this.testFormSubmission,
      this.testNavigation,
      this.testResponsiveDesign
    ];

    for (const test of tests) {
      try {
        await test.call(this);
        this.logTestResult(test.name, 'PASS');
      } catch (error) {
        this.logTestResult(test.name, 'FAIL', error.message);
      }
    }
  },

  async testFormSubmission() {
    // Encontrar formulario
    const forms = document.querySelectorAll('form');
    if (forms.length === 0) {
      throw new Error('No se encontraron formularios');
    }

    // Resaltar formulario
    sendCommand({
      action: 'highlight',
      selector: 'form',
      style: {
        outline: '3px solid #4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)'
      }
    });

    // Llenar campos de prueba
    const testInputs = {
      'input[type="text"]': 'Test User',
      'input[type="email"]': 'test@example.com',
      'input[type="password"]': 'testpassword123',
      'textarea': 'Test message content'
    };

    for (const [selector, value] of Object.entries(testInputs)) {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => {
        el.value = value;
        sendCommand({
          action: 'highlight',
          selector: selector,
          style: {
            outline: '2px solid #2196f3'
          }
        });
      });
    }

    // Enviar formulario
    await sendCommand({
      action: 'click_element',
      selector: 'button[type="submit"], input[type="submit"]'
    });

    return true;
  },

  async testNavigation() {
    // Probar enlaces principales
    const mainLinks = document.querySelectorAll('nav a, .navigation a');

    for (const link of mainLinks.slice(0, 3)) { // Limitar a 3 enlaces
      sendCommand({
        action: 'highlight',
        selector: `a[href="${link.href}"]`,
        style: {
          outline: '2px solid #9c27b0'
        }
      });

      // Simular clic
      link.click();

      // Esperar carga
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Volver atrás
      window.history.back();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return true;
  },

  async testResponsiveDesign() {
    // Probar diferentes tamaños de ventana
    const sizes = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const size of sizes) {
      sendCommand({
        action: 'text',
        text: `📱 Probando vista ${size.name}: ${size.width}x${size.height}`,
        position: [10, 10],
        color: '#ffffff',
        backgroundColor: 'rgba(156, 39, 176, 0.9)',
        fontSize: 14
      });

      // Simular cambio de tamaño
      window.resizeTo(size.width, size.height);
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar elementos importantes
      const importantElements = document.querySelectorAll('h1, .main-content, .navigation');
      importantElements.forEach(el => {
        const rect = el.getBoundingClientRect();

        // Verificar si el elemento es visible
        if (rect.width > 0 && rect.height > 0) {
          sendCommand({
            action: 'highlight',
            selector: `#${el.id || el.className}`,
            style: {
              outline: '1px solid #4caf50'
            }
          });
        } else {
          sendCommand({
            action: 'highlight',
            selector: `#${el.id || el.className}`,
            style: {
              outline: '2px solid #f44336'
            }
          });
        }
      });

      await new Promise(resolve => setTimeout(resolve, 1000));
      sendCommand({ action: 'clear', type: 'overlay' });
    }

    return true;
  },

  logTestResult(testName, result, error = null) {
    const color = result === 'PASS' ? '#4caf50' : '#f44336';
    const text = result === 'PASS' ?
      `✅ ${testName}: PASSED` :
      `❌ ${testName}: FAILED - ${error}`;

    sendCommand({
      action: 'text',
      text: text,
      position: [10, 100 + this.testCounter * 25],
      color: '#ffffff',
      backgroundColor: color,
      fontSize: 12
    });

    this.testCounter = (this.testCounter || 0) + 1;
  }
};

// Ejecutar suite de pruebas
testAutomation.runTestSuite();
```

---

Para más información, consulta la [documentación principal](../README.md) o el [repositorio de ejemplos](https://github.com/ejemplos/ai-browser-overlay).