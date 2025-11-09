const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
const path = require('path');
const WebSocket = require('ws');
const fs = require('fs');

// Configuración
const config = {
  width: 1400,
  height: 900,
  webPreferences: {
    nodeIntegration: false,
    contextIsolation: true,
    enableRemoteModule: false,
    preload: path.join(__dirname, 'preload.js'),
    webSecurity: true,
    allowRunningInsecureContent: false
  },
  overlayOpacity: 0.3,
  debugMode: process.argv.includes('--dev')
};

class AIBrowserOverlay {
  constructor() {
    this.mainWindow = null;
    this.overlayWindow = null;
    this.aiServer = null;
    this.wsConnection = null;
    this.isDevelopment = process.env.NODE_ENV === 'development' || config.debugMode;
  }

  async initialize() {
    await this.createMainWindow();
    await this.createOverlayWindow();
    await this.setupAIServer();
    await this.setupEventHandlers();

    if (this.isDevelopment) {
      this.mainWindow.webContents.openDevTools();
      this.overlayWindow.webContents.openDevTools();
    }
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: config.width,
      height: config.height,
      webPreferences: config.webPreferences,
      title: 'AI Browser - Navegador con Capa IA',
      icon: path.join(__dirname, '../assets/icons/icon.png')
    });

    // Cargar página inicial
    await this.mainWindow.loadURL('https://google.com');

    // Manejar navegación
    this.mainWindow.webContents.on('did-navigate', (event, url) => {
      this.sendPageUpdateToAI(url);
    });

    this.mainWindow.webContents.on('page-title-updated', (event, title) => {
      this.sendToAI({
        type: 'page_title_updated',
        title: title,
        url: this.mainWindow.webContents.getURL()
      });
    });

    return this.mainWindow;
  }

  async createOverlayWindow() {
    // Crear ventana transparente para overlay
    this.overlayWindow = new BrowserWindow({
      width: config.width,
      height: config.height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      movable: false,
      webPreferences: {
        ...config.webPreferences,
        preload: path.join(__dirname, 'preload', 'overlay-preload.js')
      }
    });

    // Posicionar la ventana de overlay sobre la ventana principal
    const [mainX, mainY] = this.mainWindow.getPosition();
    this.overlayWindow.setPosition(mainX, mainY);

    // Cargar la interfaz del overlay
    await this.overlayWindow.loadFile(path.join(__dirname, 'renderer/overlay.html'));

    // Sincronizar posición con ventana principal
    this.mainWindow.on('moved', () => {
      const [x, y] = this.mainWindow.getPosition();
      this.overlayWindow.setPosition(x, y);
    });

    this.mainWindow.on('resized', () => {
      const [x, y] = this.mainWindow.getPosition();
      const [width, height] = this.mainWindow.getSize();
      this.overlayWindow.setPosition(x, y);
      this.overlayWindow.setSize(width, height);
    });

    return this.overlayWindow;
  }

  async setupAIServer() {
    // Configurar conexión WebSocket con el servidor IA
    try {
      this.wsConnection = new WebSocket('ws://localhost:8080');

      this.wsConnection.on('open', () => {
        console.log('Conectado al servidor IA');
        this.sendToAI({
          type: 'browser_ready',
          config: {
            width: config.width,
            height: config.height,
            overlayOpacity: config.overlayOpacity
          }
        });
      });

      this.wsConnection.on('message', async (data) => {
        try {
          const command = JSON.parse(data.toString());
          await this.handleAICommand(command);
        } catch (error) {
          console.error('Error procesando comando IA:', error);
        }
      });

      this.wsConnection.on('close', () => {
        console.log('Desconectado del servidor IA');
        // Intentar reconectar cada 5 segundos
        setTimeout(() => this.setupAIServer(), 5000);
      });

    } catch (error) {
      console.error('Error conectando al servidor IA:', error);
      console.log('Asegúrate de ejecutar: npm run server');
    }
  }

  async handleAICommand(command) {
    switch (command.action) {
      case 'draw':
        await this.sendToOverlay(command);
        break;
      case 'highlight':
        await this.sendToMain({
          type: 'dom_manipulation',
          command: command
        });
        break;
      case 'capture':
        await this.captureAndSendScreenshot();
        break;
      case 'navigate':
        if (command.url) {
          await this.mainWindow.loadURL(command.url);
        }
        break;
      case 'get_dom':
        await this.sendDOMToAI();
        break;
      case 'clear_overlay':
        await this.sendToOverlay({ action: 'clear' });
        break;
      default:
        console.log('Comando IA no reconocido:', command);
    }
  }

  async captureAndSendScreenshot() {
    try {
      const image = await this.mainWindow.webContents.capturePage();
      const screenshot = image.toPNG();

      // Convertir a base64 para enviar por WebSocket
      const base64Screenshot = screenshot.toString('base64');

      this.sendToAI({
        type: 'screenshot',
        data: base64Screenshot,
        url: this.mainWindow.webContents.getURL(),
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error capturando pantalla:', error);
    }
  }

  async sendDOMToAI() {
    try {
      const dom = await this.mainWindow.webContents.executeJavaScript(`
        (function() {
          return {
            url: window.location.href,
            title: document.title,
            html: document.documentElement.outerHTML,
            textContent: document.body.innerText,
            elements: Array.from(document.querySelectorAll('*')).map(el => ({
              tagName: el.tagName,
              id: el.id,
              className: el.className,
              text: el.textContent?.substring(0, 100),
              boundingBox: el.getBoundingClientRect()
            }))
          };
        })()
      `);

      this.sendToAI({
        type: 'dom_data',
        data: dom,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error('Error obteniendo DOM:', error);
    }
  }

  async sendPageUpdateToAI(url) {
    this.sendToAI({
      type: 'page_navigated',
      url: url,
      timestamp: Date.now()
    });

    // Capturar pantalla y DOM automáticamente
    await this.captureAndSendScreenshot();
    await this.sendDOMToAI();
  }

  sendToAI(data) {
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify(data));
    }
  }

  sendToOverlay(data) {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send('ai-command', data);
    }
  }

  sendToMain(data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('ai-command', data);
    }
  }

  setupEventHandlers() {
    // Manejar eventos IPC desde el renderer
    ipcMain.handle('get-browser-info', () => ({
      url: this.mainWindow.webContents.getURL(),
      title: this.mainWindow.getTitle()
    }));

    ipcMain.handle('request-screenshot', async () => {
      await this.captureAndSendScreenshot();
    });

    ipcMain.handle('request-dom-analysis', async () => {
      await this.sendDOMToAI();
    });

    // Manejar cierre de ventanas
    this.mainWindow.on('closed', () => {
      if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
        this.overlayWindow.close();
      }
      if (this.wsConnection) {
        this.wsConnection.close();
      }
      app.quit();
    });
  }
}

// Inicializar aplicación cuando Electron esté listo
app.whenReady().then(async () => {
  const aiBrowser = new AIBrowserOverlay();
  await aiBrowser.initialize();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', async () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    const aiBrowser = new AIBrowserOverlay();
    await aiBrowser.initialize();
  }
});