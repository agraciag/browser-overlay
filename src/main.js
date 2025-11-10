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

    // Enviar estado inicial desconectado al overlay
    this.sendToOverlay({ action: 'status', connected: false });

    if (this.isDevelopment) {
      this.mainWindow.webContents.openDevTools();
      this.overlayWindow.webContents.openDevTools();
    }
    // En producción no abrir DevTools automáticamente
  }

  async createMainWindow() {
    this.mainWindow = new BrowserWindow({
      width: config.width,
      height: config.height,
      webPreferences: {
        ...config.webPreferences,
        preload: path.join(__dirname, 'preload.js')
      },
      title: 'AI Browser - Navegador con Capa IA',
      icon: path.join(__dirname, '../assets/icons/icon.png')
    });

    // Obtener URL inicial de los argumentos de línea de comandos
    const urlArg = process.argv.find(arg => arg.startsWith('--url='));
    const initialUrl = urlArg ? urlArg.substring(6) : 'https://google.com';

    console.log(`URL inicial: ${initialUrl}`);

    // Cargar página inicial directamente
    await this.mainWindow.loadURL(initialUrl);

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

    // Insertar barra de direcciones flotante después de cargar
    setTimeout(() => {
      this.injectAddressBar();
    }, 2000);

    // También intentar con dom-ready
    this.mainWindow.webContents.on('dom-ready', () => {
      setTimeout(() => {
        this.injectAddressBar();
      }, 1000);
    });

    // Y con did-finish-load
    this.mainWindow.webContents.on('did-finish-load', () => {
      setTimeout(() => {
        this.injectAddressBar();
      }, 500);
    });

    return this.mainWindow;
  }

  injectAddressBar() {
    console.log('Intentando inyectar barra de direcciones...');

    const addressBarCode = `
      (function() {
        console.log('Iniciando inyección de barra de direcciones');

        // Eliminar barra si ya existe
        const existingBar = document.getElementById('ai-browser-address-bar');
        const existingToggle = document.getElementById('ai-browser-toggle');
        if (existingBar) existingBar.remove();
        if (existingToggle) existingToggle.remove();

        // Crear toggle button primero
        const toggleButton = document.createElement('button');
        toggleButton.id = 'ai-browser-toggle';
        toggleButton.textContent = '🌐';
        toggleButton.title = 'Mostrar/Ocultar Barra de Direcciones';
        toggleButton.style.cssText = \`
          position: fixed;
          top: 10px;
          right: 10px;
          background: rgba(33, 33, 33, 0.9) !important;
          color: white !important;
          border: none !important;
          padding: 8px !important;
          border-radius: 50% !important;
          cursor: pointer !important;
          font-size: 16px !important;
          width: 40px !important;
          height: 40px !important;
          z-index: 2147483647 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
          backdrop-filter: blur(10px) !important;
          transition: all 0.3s ease !important;
        \`;

        // Crear barra de direcciones
        const addressBar = document.createElement('div');
        addressBar.id = 'ai-browser-address-bar';
        addressBar.style.cssText = \`
          position: fixed !important;
          top: 60px !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: rgba(255, 255, 255, 0.98) !important;
          border: 1px solid #ddd !important;
          border-radius: 12px !important;
          padding: 12px 16px !important;
          display: flex !important;
          align-items: center !important;
          gap: 10px !important;
          z-index: 2147483647 !important;
          box-shadow: 0 8px 32px rgba(0,0,0,0.2) !important;
          backdrop-filter: blur(20px) !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          opacity: 1 !important;
          transition: all 0.3s ease !important;
          min-width: 400px !important;
        \`;

        const urlInput = document.createElement('input');
        urlInput.type = 'text';
        urlInput.placeholder = 'Introduce URL...';
        urlInput.value = window.location.href;
        urlInput.style.cssText = \`
          border: 1px solid #e0e0e0 !important;
          outline: none !important;
          background: white !important;
          padding: 8px 12px !important;
          font-size: 14px !important;
          width: 300px !important;
          color: #333 !important;
          border-radius: 6px !important;
          flex: 1 !important;
        \`;

        const goButton = document.createElement('button');
        goButton.textContent = 'Ir';
        goButton.style.cssText = \`
          background: #2196f3 !important;
          color: white !important;
          border: none !important;
          padding: 8px 16px !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          transition: background 0.2s ease !important;
        \`;

        addressBar.appendChild(urlInput);
        addressBar.appendChild(goButton);
        document.body.appendChild(addressBar);
        document.body.appendChild(toggleButton);

        // Event listeners
        toggleButton.addEventListener('click', () => {
          console.log('Toggle button clicked');
          const isVisible = addressBar.style.opacity === '1';
          addressBar.style.opacity = isVisible ? '0' : '1';
          if (!isVisible) {
            urlInput.focus();
            urlInput.select();
          }
        });

        goButton.addEventListener('click', () => {
          console.log('Go button clicked');
          let url = urlInput.value.trim();
          if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
          }
          console.log('Navegando a:', url);
          window.location.href = url;
        });

        urlInput.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            goButton.click();
          }
        });

        // La barra ya es visible por defecto - no necesita timeout

        // Atajo de teclado Ctrl+L para mostrar barra
        document.addEventListener('keydown', (e) => {
          if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            addressBar.style.opacity = '1';
            urlInput.focus();
            urlInput.select();
          }
        });

        // Hover effects
        toggleButton.addEventListener('mouseenter', () => {
          toggleButton.style.background = 'rgba(33, 33, 33, 1) !important';
          toggleButton.style.transform = 'scale(1.1) !important';
        });

        toggleButton.addEventListener('mouseleave', () => {
          toggleButton.style.background = 'rgba(33, 33, 33, 0.9) !important';
          toggleButton.style.transform = 'scale(1) !important';
        });

        goButton.addEventListener('mouseenter', () => {
          goButton.style.background = '#1976d2 !important';
        });

        goButton.addEventListener('mouseleave', () => {
          goButton.style.background = '#2196f3 !important';
        });

        console.log('✅ Barra de direcciones IA Browser inyectada correctamente');
        return 'Barra inyectada';
      })();
    `;

    this.mainWindow.webContents.executeJavaScript(addressBarCode)
      .then(result => {
        console.log('✅ Inyección exitosa:', result);
      })
      .catch(err => {
        console.error('❌ Error inyectando barra de direcciones:', err);
      });
  }

  async createOverlayWindow() {
    // Crear ventana transparente para overlay
    this.overlayWindow = new BrowserWindow({
      width: config.width,
      height: config.height,
      transparent: true,
      frame: false,
      alwaysOnTop: false, // Cambiado para permitir interacción
      skipTaskbar: true,
      resizable: false,
      movable: false,
      focusable: false, // No debe recibir foco
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

    // Asegurar que el overlay siempre esté encima
    this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
    this.mainWindow.focus(); // Devolver el foco a la ventana principal

    // Sincronizar posición con ventana principal
    this.mainWindow.on('moved', () => {
      const [x, y] = this.mainWindow.getPosition();
      this.overlayWindow.setPosition(x, y);
      this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
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
      this.wsConnection = new WebSocket('ws://localhost:33333');

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
        // Enviar estado de conexión al overlay
        this.sendToOverlay({ action: 'status', connected: true });
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
        // Enviar estado de conexión al overlay
        this.sendToOverlay({ action: 'status', connected: false });
        // Intentar reconectar cada 5 segundos
        setTimeout(() => this.setupAIServer(), 5000);
      });

    } catch (error) {
      console.error('Error conectando al servidor IA:', error);
      console.log('Asegúrate de ejecutar: npm run server');
    }
  }

  async handleAICommand(command) {
    console.log('🎯 handleAICommand recibido:', command);

    // Manejar diferentes formatos de comandos
    const action = command.action || command.type;

    switch (action) {
      case 'draw':
        console.log('📐 Procesando comando draw');
        await this.sendToOverlay(command);
        this.bringOverlayToFront();
        break;
      case 'highlight':
        console.log('🎨 Procesando comando highlight');
        await this.sendToMain({
          type: 'dom_manipulation',
          command: command
        });
        this.bringOverlayToFront();
        break;
      case 'text':
        console.log('📝 Procesando comando text');
        await this.sendToOverlay(command);
        this.bringOverlayToFront();
        break;
      case 'arrow':
        console.log('➡️ Procesando comando arrow');
        await this.sendToOverlay(command);
        this.bringOverlayToFront();
        break;
      case 'circle':
        console.log('⭕ Procesando comando circle');
        await this.sendToOverlay(command);
        this.bringOverlayToFront();
        break;
      case 'rectangle':
        console.log('⬜ Procesando comando rectangle');
        await this.sendToOverlay(command);
        this.bringOverlayToFront();
        break;
      case 'capture':
        console.log('📸 Procesando comando capture');
        await this.captureAndSendScreenshot();
        break;
      case 'navigate':
        console.log('🌐 Procesando comando navigate');
        if (command.url) {
          await this.mainWindow.loadURL(command.url);
        }
        break;
      case 'get_dom':
        console.log('🔍 Procesando comando get_dom');
        await this.sendDOMToAI();
        break;
      case 'clear_overlay':
        console.log('🧹 Procesando comando clear_overlay');
        await this.sendToOverlay({ action: 'clear' });
        break;
      case 'clear':
        console.log('🧹 Procesando comando clear - enviando al overlay');
        await this.sendToOverlay({ action: 'clear' });
        console.log('✅ Comando clear enviado al overlay');
        break;
      case 'rectangle':
        console.log('⬜ Procesando comando rectangle');
        await this.sendToOverlay(command);
        this.bringOverlayToFront();
        break;
      case 'circle':
        console.log('⭕ Procesando comando circle');
        await this.sendToOverlay(command);
        this.bringOverlayToFront();
        break;
      case 'welcome':
      case 'page_navigated':
      case 'page_title_updated':
        console.log('ℹ️ Procesando comando informativo:', action);
        break;
      default:
        console.log('❌ Comando IA no reconocido:', command);
        console.log('❌ Action:', action);
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
    console.log('🔄 Enviando comando al overlay:', data);
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.webContents.send('ai-command', data);
      console.log('✅ Comando enviado al overlay');
    } else {
      console.log('❌ Overlay window no disponible');
    }
  }

  sendToMain(data) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('ai-command', data);
    }
  }

  bringOverlayToFront() {
    if (this.overlayWindow && !this.overlayWindow.isDestroyed()) {
      this.overlayWindow.setAlwaysOnTop(true, 'screen-saver');
      this.overlayWindow.focus();

      // Devolver el foco a la ventana principal después de un breve retraso
      setTimeout(() => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.focus();
        }
      }, 100);
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