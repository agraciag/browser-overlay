const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

class AIServer {
  constructor(port = 33333) {
    this.port = port;
    this.httpPort = port + 1; // Puerto para Express
    this.app = express();
    this.wss = null;
    this.clients = new Map();
    this.browserConnection = null;
    this.aiModels = new Map();
    this.commandHistory = [];
    this.analysisCache = new Map();

    this.init();
  }

  init() {
    this.setupExpress();
    this.setupWebSocket();
    this.loadAIModels();
    this.startServer();
  }

  setupExpress() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../../assets')));

    // Rutas para la API REST
    this.app.get('/api/status', (req, res) => {
      res.json({
        status: 'running',
        clients: this.clients.size,
        browserConnected: !!this.browserConnection,
        models: Array.from(this.aiModels.keys()),
        uptime: process.uptime()
      });
    });

    this.app.post('/api/command', (req, res) => {
      this.handleCommand(req.body);
      res.json({ status: 'received' });
    });

    this.app.get('/api/history', (req, res) => {
      res.json(this.commandHistory.slice(-50)); // Últimos 50 comandos
    });

    this.app.post('/api/analyze', async (req, res) => {
      try {
        const analysis = await this.analyzeImage(req.body.image, req.body.prompt);
        res.json(analysis);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Servir interfaz web de control
    this.app.get('/control', (req, res) => {
      res.sendFile(path.join(__dirname, 'control-panel.html'));
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: this.port });

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      const clientInfo = {
        id: clientId,
        ws: ws,
        type: 'unknown',
        connectedAt: new Date(),
        lastActivity: new Date()
      };

      this.clients.set(clientId, clientInfo);
      console.log(`Cliente conectado: ${clientId}`);

      ws.on('message', async (data) => {
        await this.handleMessage(clientId, data);
      });

      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      ws.on('error', (error) => {
        console.error(`Error en cliente ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });

      // Enviar mensaje de bienvenida
      this.sendToClient(clientId, {
        type: 'welcome',
        clientId: clientId,
        serverInfo: {
          version: '1.0.0',
          features: ['dom_analysis', 'screenshot', 'overlay_drawing', 'voice_commands']
        }
      });
    });

    console.log(`Servidor WebSocket iniciado en puerto ${this.port}`);
  }

  async handleMessage(clientId, data) {
    try {
      const message = JSON.parse(data.toString());
      const client = this.clients.get(clientId);

      if (!client) return;

      client.lastActivity = new Date();

      // Identificar tipo de cliente
      if (message.type === 'browser_ready') {
        client.type = 'browser';
        this.browserConnection = client;
        console.log('Navegador conectado al servidor IA');

        this.broadcast({
          type: 'browser_connected',
          info: message.config
        }, 'control');
      } else if (message.type === 'control_ready') {
        client.type = 'control';
        console.log('Panel de control conectado');
      }

      // Procesar mensaje según tipo
      switch (message.type) {
        case 'screenshot':
          await this.handleScreenshot(clientId, message);
          break;
        case 'dom_data':
          await this.handleDOMData(clientId, message);
          break;
        case 'page_navigated':
          await this.handlePageNavigation(clientId, message);
          break;
        case 'element_clicked':
          await this.handleElementClick(clientId, message);
          break;
        case 'element_highlighted':
          await this.handleElementHighlighted(clientId, message);
          break;
        case 'dom_changed':
          await this.handleDOMChanged(clientId, message);
          break;
        case 'request_analysis':
          await this.handleAnalysisRequest(clientId, message);
          break;
        case 'voice_command':
          await this.handleVoiceCommand(clientId, message);
          break;
        default:
          console.log(`Mensaje de tipo ${message.type} recibido de ${clientId}`);
      }

      // Guardar en historial
      this.commandHistory.push({
        timestamp: new Date(),
        clientId: clientId,
        clientType: client.type,
        message: message
      });

      // Limitar historial
      if (this.commandHistory.length > 1000) {
        this.commandHistory = this.commandHistory.slice(-500);
      }

    } catch (error) {
      console.error(`Error procesando mensaje de ${clientId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        message: 'Error procesando mensaje',
        details: error.message
      });
    }
  }

  async handleScreenshot(clientId, message) {
    console.log('Screenshot recibido, procesando análisis...');

    try {
      // Analizar imagen con IA
      const analysis = await this.analyzeImage(message.data, message.url);

      // Generar comandos de overlay basados en el análisis
      const overlayCommands = this.generateOverlayCommands(analysis);

      // Enviar comandos al navegador
      if (this.browserConnection) {
        for (const command of overlayCommands) {
          this.sendToClient(this.browserConnection.id, command);
          await this.sleep(500); // Pequeña pausa entre comandos
        }
      }

      // Enviar análisis a todos los clientes de control
      this.broadcast({
        type: 'screenshot_analysis',
        analysis: analysis,
        commands: overlayCommands,
        url: message.url,
        timestamp: message.timestamp
      }, 'control');

    } catch (error) {
      console.error('Error analizando screenshot:', error);
    }
  }

  async handleDOMData(clientId, message) {
    console.log('Datos DOM recibidos, procesando...');

    try {
      // Analizar estructura DOM
      const analysis = this.analyzeDOM(message.data);

      // Identificar elementos interesantes para resaltar
      const interestingElements = this.findInterestingElements(analysis);

      // Generar comandos de resaltado
      const highlightCommands = this.generateHighlightCommands(interestingElements);

      // Enviar comandos al navegador
      if (this.browserConnection) {
        for (const command of highlightCommands) {
          this.sendToClient(this.browserConnection.id, command);
        }
      }

      // Enviar análisis a clientes de control
      this.broadcast({
        type: 'dom_analysis',
        analysis: analysis,
        interestingElements: interestingElements,
        url: message.data.url,
        timestamp: message.timestamp
      }, 'control');

    } catch (error) {
      console.error('Error analizando DOM:', error);
    }
  }

  async handlePageNavigation(clientId, message) {
    console.log(`Navegación a: ${message.url}`);

    this.broadcast({
      type: 'page_navigated',
      url: message.url,
      timestamp: message.timestamp
    }, 'all');

    // Limpiar caché de análisis para nueva página
    this.analysisCache.clear();
  }

  async handleAnalysisRequest(clientId, message) {
    const { type, data, prompt } = message;

    try {
      let analysis;

      switch (type) {
        case 'screenshot':
          analysis = await this.analyzeImage(data, prompt);
          break;
        case 'dom':
          analysis = this.analyzeDOM(data);
          break;
        case 'text':
          analysis = await this.analyzeText(data, prompt);
          break;
        default:
          throw new Error(`Tipo de análisis no soportado: ${type}`);
      }

      this.sendToClient(clientId, {
        type: 'analysis_result',
        analysis: analysis,
        requestId: message.requestId
      });

    } catch (error) {
      this.sendToClient(clientId, {
        type: 'analysis_error',
        error: error.message,
        requestId: message.requestId
      });
    }
  }

  async handleVoiceCommand(clientId, message) {
    console.log('Comando de voz recibido:', message.command);

    try {
      // Procesar comando de voz
      const processedCommand = await this.processVoiceCommand(message.command);

      // Ejecutar comando
      if (this.browserConnection) {
        this.sendToClient(this.browserConnection.id, processedCommand);
      }

      this.sendToClient(clientId, {
        type: 'voice_command_processed',
        original: message.command,
        processed: processedCommand,
        timestamp: Date.now()
      });

    } catch (error) {
      this.sendToClient(clientId, {
        type: 'voice_command_error',
        error: error.message,
        command: message.command
      });
    }
  }

  // Métodos de análisis
  async analyzeImage(base64Image, url) {
    // Simulación de análisis de imagen con IA
    // En un caso real, aquí se llamaría a una API de IA como GPT Vision o similar

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          description: "Página web principal con navegación y contenido principal visible",
          layout: {
            header: { x: 0, y: 0, width: 100, height: 10 },
            navigation: { x: 0, y: 10, width: 100, height: 5 },
            main: { x: 0, y: 15, width: 70, height: 75 },
            sidebar: { x: 70, y: 15, width: 30, height: 75 },
            footer: { x: 0, y: 90, width: 100, height: 10 }
          },
          elements: [
            { type: 'button', text: 'Iniciar sesión', confidence: 0.9 },
            { type: 'link', text: 'Contáctanos', confidence: 0.8 },
            { type: 'form', fields: ['email', 'password'], confidence: 0.85 }
          ],
          accessibility: {
            score: 7.5,
            issues: ['Faltan etiquetas alt en imágenes', 'Contraste bajo en algunos textos']
          },
          suggestions: [
            'Resaltar el botón principal de llamada a la acción',
            'Mejorar el contraste del texto',
            'Añadir descripciones a las imágenes'
          ]
        });
      }, 1000);
    });
  }

  analyzeDOM(domData) {
    return {
      structure: {
        title: domData.title,
        url: domData.url,
        elementCount: domData.elements.length,
        textLength: domData.textContent.length
      },
      interactiveElements: domData.elements.filter(el =>
        ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName)
      ),
      forms: domData.elements.filter(el => el.tagName === 'FORM'),
      headings: domData.elements.filter(el => /^H[1-6]$/.test(el.tagName)),
      images: domData.elements.filter(el => el.tagName === 'IMG'),
      accessibility: {
        hasTitle: !!domData.title,
        hasLang: domData.html?.includes('lang='),
        hasAltText: domData.elements.filter(el => el.tagName === 'IMG' && el.alt).length
      }
    };
  }

  findInterestingElements(analysis) {
    const interesting = [];

    // Botones principales
    analysis.interactiveElements.forEach(element => {
      if (element.tagName === 'BUTTON' && element.text.includes('iniciar') ||
          element.text.includes('empezar') || element.text.includes('comenzar')) {
        interesting.push({
          element: element,
          reason: 'Botón de acción principal',
          confidence: 0.9
        });
      }
    });

    // Formularios importantes
    analysis.forms.forEach(form => {
      interesting.push({
        element: form,
        reason: 'Formulario de usuario',
        confidence: 0.8
      });
    });

    // Enlaces importantes
    analysis.interactiveElements.forEach(element => {
      if (element.tagName === 'A' &&
          (element.text.includes('contact') || element.text.includes('ayuda') ||
           element.text.includes('soporte'))) {
        interesting.push({
          element: element,
          reason: 'Enlace de ayuda/contacto',
          confidence: 0.7
        });
      }
    });

    return interesting.sort((a, b) => b.confidence - a.confidence);
  }

  generateOverlayCommands(analysis) {
    const commands = [];

    // Añadir título de análisis
    commands.push({
      action: 'text',
      text: 'Análisis IA',
      position: [100, 50],
      color: '#ffffff',
      backgroundColor: 'rgba(33, 33, 33, 0.9)',
      fontSize: 18,
      id: 'analysis_title'
    });

    // Resaltar áreas de layout
    Object.entries(analysis.layout).forEach(([area, bounds], index) => {
      commands.push({
        action: 'rectangle',
        x: (bounds.x / 100) * 1200,
        y: (bounds.y / 100) * 800,
        width: (bounds.width / 100) * 1200,
        height: (bounds.height / 100) * 800,
        color: this.getAreaColor(area),
        fill: true,
        fillColor: this.getAreaColor(area) + '20',
        id: `layout_${area}`
      });

      // Etiquetar área
      commands.push({
        action: 'text',
        text: area.toUpperCase(),
        position: [(bounds.x / 100) * 1200 + 10, (bounds.y / 100) * 800 + 20],
        color: this.getAreaColor(area),
        fontSize: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        id: `label_${area}`
      });
    });

    // Añadir sugerencias
    analysis.suggestions.forEach((suggestion, index) => {
      commands.push({
        action: 'text',
        text: `✓ ${suggestion}`,
        position: [100, 150 + index * 30],
        color: '#4caf50',
        fontSize: 14,
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        id: `suggestion_${index}`
      });
    });

    return commands;
  }

  generateHighlightCommands(interestingElements) {
    const commands = [];

    interestingElements.slice(0, 5).forEach((item, index) => {
      let selector;

      if (item.element.id) {
        selector = `#${item.element.id}`;
      } else if (item.element.className) {
        selector = `.${item.element.className.split(' ')[0]}`;
      } else {
        selector = item.element.tagName.toLowerCase();
      }

      commands.push({
        action: 'highlight',
        selector: selector,
        style: {
          outline: '3px solid #ff4081',
          outlineOffset: '2px',
          boxShadow: '0 0 15px rgba(255, 64, 129, 0.5)'
        },
        options: {
          addIndicator: true
        },
        id: `highlight_${index}`
      });

      // Añadir tooltip
      commands.push({
        action: 'text',
        text: item.reason,
        position: [item.element.boundingBox?.x || 100, (item.element.boundingBox?.y || 100) - 30],
        color: '#ffffff',
        backgroundColor: 'rgba(255, 64, 129, 0.9)',
        fontSize: 12,
        id: `tooltip_${index}`
      });
    });

    return commands;
  }

  getAreaColor(area) {
    const colors = {
      header: '#2196f3',
      navigation: '#4caf50',
      main: '#ff9800',
      sidebar: '#9c27b0',
      footer: '#607d8b'
    };
    return colors[area] || '#ff4081';
  }

  async processVoiceCommand(command) {
    // Procesamiento simple de comandos de voz
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes('buscar') || lowerCommand.includes('search')) {
      const searchTerm = lowerCommand.replace(/buscar|search/gi, '').trim();
      return {
        action: 'navigate',
        url: `https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`
      };
    }

    if (lowerCommand.includes('clic') || lowerCommand.includes('click')) {
      const buttonText = lowerCommand.replace(/clic|click/gi, '').trim();
      return {
        action: 'highlight',
        selector: `button:contains("${buttonText}")`,
        style: { outline: '3px solid #4caf50' }
      };
    }

    if (lowerCommand.includes('limpiar') || lowerCommand.includes('clear')) {
      return { action: 'clear' };
    }

    if (lowerCommand.includes('capturar') || lowerCommand.includes('capture')) {
      return { action: 'capture' };
    }

    return {
      action: 'text',
      text: `Comando no reconocido: "${command}"`,
      position: [100, 100],
      color: '#f44336',
      backgroundColor: 'rgba(244, 67, 54, 0.9)'
    };
  }

  // Utilidades
  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(data));
    }
  }

  broadcast(data, clientType = 'all') {
    this.clients.forEach((client, clientId) => {
      if (clientType === 'all' || client.type === clientType) {
        this.sendToClient(clientId, data);
      }
    });
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      console.log(`Cliente desconectado: ${clientId} (${client.type})`);

      if (client.type === 'browser') {
        this.browserConnection = null;
        console.log('Navegador desconectado');
      }

      this.clients.delete(clientId);
    }
  }

  generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  loadAIModels() {
    // Cargar configuración de modelos IA
    this.aiModels.set('layout_analyzer', {
      name: 'Layout Analyzer',
      version: '1.0.0',
      capabilities: ['layout_detection', 'element_classification']
    });

    this.aiModels.set('accessibility_checker', {
      name: 'Accessibility Checker',
      version: '1.0.0',
      capabilities: ['wcag_analysis', 'contrast_detection']
    });

    console.log(`Modelos IA cargados: ${this.aiModels.size}`);
  }

  startServer() {
    this.app.listen(this.httpPort, () => {
      console.log(`Servidor IA iniciado en puerto ${this.port}`);
      console.log(`Panel de control: http://localhost:${this.httpPort}/control`);
      console.log(`API REST: http://localhost:${this.httpPort}/api/`);
    });
  }
}

// Iniciar servidor
const server = new AIServer(33333);

// Manejar cierre graceful
process.on('SIGINT', () => {
  console.log('Cerrando servidor IA...');
  process.exit(0);
});

module.exports = AIServer;