const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs específicas para el overlay
contextBridge.exposeInMainWorld('electronAPI', {
  // Comunicación con IA
  onAICommand: (callback) => {
    ipcRenderer.on('ai-command', (event, data) => callback(data));
  },

  // Enviar eventos al proceso principal
  sendOverlayReady: () => ipcRenderer.send('overlay-ready'),
  sendOverlayEvent: (event, data) => ipcRenderer.send('overlay-event', event, data),

  // Utilidades
  log: (...args) => console.log('[Overlay]', ...args),
});

// Enviar señal de que el preload está listo
window.addEventListener('DOMContentLoaded', () => {
  if (window.electronAPI) {
    window.electronAPI.sendOverlayReady();
  }
});