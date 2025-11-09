# 🤖 AI Browser Overlay

Navegador experimental con capa IA interactiva capaz de analizar páginas web y guiar visualmente a los usuarios mediante anotaciones, resaltados y modificaciones en tiempo real.

## 🌟 Características Principales

### Modo Overlay (Capa Visual)
- **Canvas flotante transparente** sobre el contenido web
- **Dibujo en tiempo real**: flechas, círculos, rectángulos, texto
- **Animaciones suaves** y efectos visuales
- **Comandos JSON** para control preciso
- **No interferencia** con la funcionalidad del sitio

### Modo CSS/DOM (Manipulación Estructural)
- **Resaltado de elementos** mediante selectores CSS
- **Modificación de estilos** sin romper el sitio
- **Inyección de elementos** personalizados
- **Automatización de interacciones**
- **Análisis de accesibilidad** integrado

### Backend IA
- **Servidor WebSocket** para comunicación en tiempo real
- **Análisis visual** de capturas de pantalla
- **Procesamiento de estructura DOM**
- **Comandos de voz** (experimental)
- **Panel de control web** integrado

## 🚀 Guía Rápida

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd browser_overlay

# Instalar dependencias
npm install

# Iniciar el servidor IA
npm run server

# Iniciar el navegador (en otra terminal)
npm start
```

### Uso Básico

1. **Iniciar el sistema**:
   ```bash
   # Terminal 1: Servidor IA
   npm run server

   # Terminal 2: Navegador
   npm start
   ```

2. **Acceder al panel de control**:
   Abre http://localhost:8080/control en tu navegador

3. **Enviar comandos**:
   - Usa el panel de control para enviar comandos predefinidos
   - Crea comandos JSON personalizados
   - Observa los resultados en tiempo real

## 📚 Comandos JSON

### Comandos de Dibujo (Overlay)

#### Flecha
```json
{
  "action": "arrow",
  "from": [100, 100],
  "to": [300, 200],
  "color": "#ff4081",
  "width": 3,
  "animated": true
}
```

#### Círculo
```json
{
  "action": "circle",
  "center": [400, 300],
  "radius": 50,
  "color": "#4caf50",
  "fill": true,
  "fillColor": "rgba(76, 175, 80, 0.2)"
}
```

#### Rectángulo
```json
{
  "action": "rectangle",
  "x": 200,
  "y": 150,
  "width": 200,
  "height": 100,
  "color": "#2196f3",
  "borderRadius": 8
}
```

#### Texto
```json
{
  "action": "text",
  "text": "Haga clic aquí para continuar",
  "position": [300, 200],
  "color": "#ffffff",
  "backgroundColor": "rgba(33, 33, 33, 0.9)",
  "fontSize": 16
}
```

### Comandos de Manipulación DOM

#### Resaltar Elemento
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
  }
}
```

#### Modificar Estilos
```json
{
  "action": "modify_style",
  "selector": "header",
  "styles": {
    "backgroundColor": "#f0f0f0",
    "border": "2px solid #2196f3"
  }
}
```

#### Ocultar/Mostrar Elementos
```json
{
  "action": "hide",
  "selector": ".advertisement"
}
```

```json
{
  "action": "show",
  "selector": ".advertisement"
}
```

#### Simular Clic
```json
{
  "action": "click_element",
  "selector": "button[type='submit']"
}
```

#### Hacer Scroll
```json
{
  "action": "scroll_to",
  "selector": "#main-content",
  "options": {
    "behavior": "smooth",
    "highlightAfterScroll": true,
    "highlightDuration": 3000
  }
}
```

### Comandos de Navegación

#### Navegar a URL
```json
{
  "action": "navigate",
  "url": "https://example.com"
}
```

### Comandos de Análisis

#### Capturar Pantalla
```json
{
  "action": "capture",
  "format": "png",
  "quality": 0.9
}
```

#### Analizar DOM
```json
{
  "action": "get_dom",
  "includeText": true,
  "includeStyles": false,
  "maxDepth": 10
}
```

### Comandos de Control

#### Limpiar Overlay
```json
{
  "action": "clear",
  "type": "overlay"
}
```

#### Limpiar Elemento Específico
```json
{
  "action": "clear_element",
  "id": "element_id"
}
```

## 🔧 Arquitectura

### Componentes Principales

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Navegador     │    │   Servidor IA   │    │  Panel Control  │
│   (Electron)    │    │   (WebSocket)   │    │     (Web)       │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Ventana      │ │    │ │Procesamiento│ │    │ │Interfaz     │ │
│ │Principal    │◄┼────┼►│IA + Comandos│◄┼────┼►│Usuario      │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │Ventana      │ │    │ │Análisis     │ │    │ │Logs         │ │
│ │Overlay      │◄┼────┼►│Visual/DOM   │ │    │ │Historial    │ │
│ └─────────────┘ │    │ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Flujo de Comunicación

1. **Usuario** envía comando desde el panel de control
2. **Servidor IA** procesa y valida el comando
3. **Navegador** recibe el comando vía WebSocket
4. **Overlay** dibuja o **DOM** manipula según el comando
5. **Feedback** se envía de vuelta al panel de control

### Plugins y Extensibilidad

El sistema incluye una arquitectura de plugins con:

- **Plugin de Accesibilidad**: análisis automático WCAG
- **Plugin de Comandos de Voz**: control por voz (experimental)
- **Plugin de Analíticas**: métricas de uso
- **Plugin de Automatización**: tareas repetitivas

## 🎯 Casos de Uso

### Educación y Tutoriales
```json
{
  "action": "arrow",
  "from": [100, 200],
  "to": [350, 200],
  "color": "#4caf50"
},
{
  "action": "text",
  "text": "Paso 1: Haga clic en este botón",
  "position": [200, 150]
}
```

### Asistencia a Usuarios
```json
{
  "action": "highlight",
  "selector": "#error-message",
  "style": {
    "outline": "3px solid #f44336",
    "backgroundColor": "rgba(244, 67, 54, 0.1)"
  }
}
```

### Testing y QA
```json
{
  "action": "circle",
  "center": [300, 250],
  "radius": 80,
  "color": "#ff9800",
  "fill": true,
  "fillColor": "rgba(255, 152, 0, 0.2)"
}
```

### Presentaciones
```json
{
  "action": "text",
  "text": "🎯 Punto Clave",
  "position": [400, 300],
  "color": "#ffffff",
  "backgroundColor": "rgba(103, 58, 183, 0.9)",
  "fontSize": 24
}
```

## 🔧 Configuración

### Variables de Entorno
```bash
# Puerto del servidor IA
AI_SERVER_PORT=8080

# Modo desarrollo
NODE_ENV=development

# Nivel de logs
LOG_LEVEL=info
```

### Configuración del Navegador
```javascript
// src/main.js
const config = {
  width: 1400,
  height: 900,
  overlayOpacity: 0.3,
  debugMode: false
};
```

### Configuración de Plugins
```javascript
// Plugin de accesibilidad
{
  autoAnalyze: true,
  showWarnings: true,
  wcagLevel: 'AA'
}

// Plugin de comandos de voz
{
  language: 'es-ES',
  continuous: true,
  confidence: 0.8
}
```

## 🐛 Solución de Problemas

### Problemas Comunes

**El navegador no se inicia**:
```bash
# Reinstalar dependencias
npm install

# Verificar instalación de Electron
npx electron --version
```

**Conexión WebSocket fallida**:
```bash
# Verificar que el servidor esté corriendo
npm run server

# Verificar firewall/puertos
netstat -an | grep 8080
```

**Comandos no funcionan**:
```bash
# Revisar logs en el panel de control
# Validar JSON con herramientas online
# Verificar sintaxis en la documentación
```

### Depuración

**Modo desarrollo**:
```bash
npm run dev
```

**Logs detallados**:
```javascript
// En main.js
console.log('Debug info:', debugData);
```

**Herramientas de desarrollador**:
- Ventana principal: F12 o menú Develop
- Ventana overlay: F12 en modo desarrollo

## 🤝 Contribución

1. Fork del proyecto
2. Crear rama de feature: `git checkout - feature/nueva-funcionalidad`
3. Commit de cambios: `git commit -m 'Añadir nueva funcionalidad'`
4. Push a la rama: `git push origin feature/nueva-funcionalidad`
5. Pull Request

### Desarrollo de Plugins

```javascript
class MiPlugin {
  constructor(api) {
    this.api = api;
    this.name = 'mi-plugin';
    this.version = '1.0.0';
  }

  init(config) {
    // Inicialización del plugin
  }

  get hooks() {
    return {
      page_load: this.miHook.bind(this)
    };
  }

  miHook(data) {
    // Lógica del hook
    return data;
  }
}
```

## 📄 Licencia

MIT License - ver archivo [LICENSE](LICENSE) para detalles

## 🙏 Agradecimientos

- Electron por el framework de aplicaciones de escritorio
- WebSocket por comunicación en tiempo real
- La comunidad de código abierto

## 📞 Soporte

- **Issues**: [GitHub Issues](https://github.com/user/repo/issues)
- **Discusiones**: [GitHub Discussions](https://github.com/user/repo/discussions)
- **Email**: support@ai-browser.com

---

**AI Browser Overlay** - Transformando la experiencia web con IA visual 🚀