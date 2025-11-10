const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras al proceso renderer
contextBridge.exposeInMainWorld('electronAPI', {
    // Información del navegador
    getBrowserInfo: () => ipcRenderer.invoke('get-browser-info'),

    // Solicitar captura de pantalla
    requestScreenshot: () => ipcRenderer.invoke('request-screenshot'),

    // Solicitar análisis DOM
    requestDOMAnalysis: () => ipcRenderer.invoke('request-dom-analysis'),

    // Enviar comandos al proceso principal
    sendCommand: (command) => ipcRenderer.send('browser-command', command),

    // Notificar cambios de página
    pageChanged: (url) => ipcRenderer.send('page-changed', url),

    // Recibir comandos del proceso principal (IA)
    onAICommand: (callback) => {
        ipcRenderer.on('ai-command', (event, command) => callback(command));
    },

    // Limpiar listeners
    removeAllListeners: (channel) => {
        ipcRenderer.removeAllListeners(channel);
    }
});

console.log('Browser preload cargado correctamente');