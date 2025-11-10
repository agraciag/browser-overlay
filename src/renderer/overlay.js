class AIOverlay {
    constructor() {
        this.canvas = document.getElementById('overlay-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.drawings = [];
        this.animations = [];
        this.isConnected = false;

        this.init();
    }

    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.startAnimationLoop();
    }

    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.redrawAll();
    }

    setupEventListeners() {
        // Escuchar comandos desde el proceso principal
        window.addEventListener('ai-command', (event) => {
            this.handleCommand(event.detail);
        });

        // Si estamos en un entorno con preload, usar ipcRenderer
        if (window.electronAPI) {
            window.electronAPI.onAICommand((command) => {
                this.handleCommand(command);
            });
        }
    }

    handleCommand(command) {
        console.log('🎯 Overlay recibió comando:', command);
        console.log('🎯 Acción:', command.action);
        console.log('🎯 Timestamp:', Date.now());

        switch (command.action) {
            case 'draw':
                this.handleDrawCommand(command);
                break;
            case 'highlight':
                this.handleHighlightCommand(command);
                break;
            case 'text':
                this.handleTextCommand(command);
                break;
            case 'arrow':
                this.handleArrowCommand(command);
                break;
            case 'circle':
                this.handleCircleCommand(command);
                break;
            case 'rectangle':
                this.handleRectangleCommand(command);
                break;
            case 'clear':
                this.clearCanvas();
                break;
            case 'clear_element':
                this.clearElement(command.id);
                break;
            case 'animate':
                this.handleAnimationCommand(command);
                break;
            case 'status':
                this.updateConnectionStatus(command.connected);
                break;
            default:
                console.warn('Comando no reconocido:', command.action);
        }
    }

    handleDrawCommand(command) {
        const drawing = {
            type: command.type || 'custom',
            id: command.id || this.generateId(),
            data: command.data || command,
            timestamp: Date.now()
        };

        this.drawings.push(drawing);
        this.redrawAll();
    }

    handleArrowCommand(command) {
        const arrow = {
            type: 'arrow',
            id: command.id || this.generateId(),
            from: command.from,
            to: command.to,
            color: command.color || '#ff4081',
            width: command.width || 2,
            style: command.style || 'solid',
            animated: command.animated || false,
            timestamp: Date.now()
        };

        this.drawings.push(arrow);
        this.redrawAll();
    }

    handleCircleCommand(command) {
        const circle = {
            type: 'circle',
            id: command.id || this.generateId(),
            center: command.center,
            radius: command.radius,
            color: command.color || '#ff4081',
            fill: command.fill || false,
            fillColor: command.fillColor || 'rgba(255, 64, 129, 0.2)',
            width: command.width || 2,
            timestamp: Date.now()
        };

        this.drawings.push(circle);
        this.redrawAll();
    }

    handleRectangleCommand(command) {
        const rectangle = {
            type: 'rectangle',
            id: command.id || this.generateId(),
            x: command.x || command.position?.[0],
            y: command.y || command.position?.[1],
            width: command.width,
            height: command.height,
            color: command.color || '#ff4081',
            fill: command.fill || false,
            fillColor: command.fillColor || 'rgba(255, 64, 129, 0.2)',
            borderRadius: command.borderRadius || 4,
            timestamp: Date.now()
        };

        this.drawings.push(rectangle);
        this.redrawAll();
    }

    handleTextCommand(command) {
        console.log('📝 Procesando comando de texto:', command);

        const text = {
            type: 'text',
            id: command.id || this.generateId(),
            text: command.text,
            x: command.x || command.position?.[0],
            y: command.y || command.position?.[1],
            color: command.color || '#ffffff',
            fontSize: command.fontSize || 16,
            fontFamily: command.fontFamily || 'Arial, sans-serif',
            backgroundColor: command.backgroundColor || 'rgba(33, 33, 33, 0.9)',
            padding: command.padding || 8,
            borderRadius: command.borderRadius || 4,
            timestamp: Date.now()
        };

        console.log('📝 Texto a dibujar:', text);
        this.drawings.push(text);
        this.redrawAll();
        console.log('📝 Texto dibujado, total drawings:', this.drawings.length);
    }

    handleHighlightCommand(command) {
        // Crear un resaltado visual en el canvas
        const highlight = {
            type: 'highlight',
            id: command.id || this.generateId(),
            selector: command.selector,
            bounds: command.bounds,
            color: command.color || '#ff4081',
            style: command.style || 'solid',
            width: command.width || 3,
            timestamp: Date.now()
        };

        this.drawings.push(highlight);
        this.redrawAll();
    }

    handleAnimationCommand(command) {
        const animation = {
            type: command.animationType || 'pulse',
            id: command.id || this.generateId(),
            target: command.target,
            duration: command.duration || 1000,
            iterations: command.iterations || 1,
            easing: command.easing || 'ease-in-out',
            timestamp: Date.now()
        };

        this.animations.push(animation);
        this.startAnimation(animation);
    }

    drawArrow(arrow) {
        const { from, to, color, width, style, animated } = arrow;

        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';

        if (style === 'dashed') {
            this.ctx.setLineDash([5, 5]);
        }

        // Dibujar línea
        this.ctx.beginPath();
        this.ctx.moveTo(from[0], from[1]);

        if (animated) {
            // Animar flecha con efecto de progreso
            const progress = (Date.now() - arrow.timestamp) % 2000 / 2000;
            const currentX = from[0] + (to[0] - from[0]) * progress;
            const currentY = from[1] + (to[1] - from[1]) * progress;
            this.ctx.lineTo(currentX, currentY);
        } else {
            this.ctx.lineTo(to[0], to[1]);
        }

        this.ctx.stroke();

        // Dibujar cabeza de flecha
        if (!animated || (Date.now() - arrow.timestamp) % 2000 > 1900) {
            const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
            const headLength = 15;

            this.ctx.beginPath();
            this.ctx.moveTo(to[0], to[1]);
            this.ctx.lineTo(
                to[0] - headLength * Math.cos(angle - Math.PI / 6),
                to[1] - headLength * Math.sin(angle - Math.PI / 6)
            );
            this.ctx.moveTo(to[0], to[1]);
            this.ctx.lineTo(
                to[0] - headLength * Math.cos(angle + Math.PI / 6),
                to[1] - headLength * Math.sin(angle + Math.PI / 6)
            );
            this.ctx.stroke();
        }

        this.ctx.restore();
    }

    drawCircle(circle) {
        const { center, radius, color, fill, fillColor, width } = circle;

        this.ctx.save();

        this.ctx.beginPath();
        this.ctx.arc(center[0], center[1], radius, 0, Math.PI * 2);

        if (fill) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawRectangle(rect) {
        const { x, y, width, height, color, fill, fillColor, borderRadius } = rect;

        this.ctx.save();

        if (borderRadius > 0) {
            this.drawRoundedRect(x, y, width, height, borderRadius);
        } else {
            this.ctx.beginPath();
            this.ctx.rect(x, y, width, height);
        }

        if (fill) {
            this.ctx.fillStyle = fillColor;
            this.ctx.fill();
        }

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawRoundedRect(x, y, width, height, radius) {
        this.ctx.beginPath();
        this.ctx.moveTo(x + radius, y);
        this.ctx.lineTo(x + width - radius, y);
        this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.ctx.lineTo(x + width, y + height - radius);
        this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.ctx.lineTo(x + radius, y + height);
        this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.ctx.lineTo(x, y + radius);
        this.ctx.quadraticCurveTo(x, y, x + radius, y);
        this.ctx.closePath();
    }

    drawText(text) {
        console.log('🎨 Dibujando texto:', text);
        const { text: content, x, y, color, fontSize, fontFamily, backgroundColor, padding, borderRadius } = text;

        this.ctx.save();
        this.ctx.font = `${fontSize}px ${fontFamily}`;
        const textMetrics = this.ctx.measureText(content);
        console.log('🎨 Medidas del texto:', { textWidth: textMetrics.width, fontSize, x, y });

        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        const boxWidth = textWidth + padding * 2;
        const boxHeight = textHeight + padding * 2;

        // Dibujar fondo
        this.ctx.fillStyle = backgroundColor;
        if (borderRadius > 0) {
            this.drawRoundedRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight, borderRadius);
            this.ctx.fill();
        } else {
            this.ctx.fillRect(x - boxWidth/2, y - boxHeight/2, boxWidth, boxHeight);
        }

        // Dibujar texto
        this.ctx.fillStyle = color;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(content, x, y);
        console.log('🎨 Texto dibujado en canvas:', { content, x, y, color });

        this.ctx.restore();
    }

    redrawAll() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Dibujar todos los elementos
        this.drawings.forEach(drawing => {
            switch (drawing.type) {
                case 'arrow':
                    this.drawArrow(drawing);
                    break;
                case 'circle':
                    this.drawCircle(drawing);
                    break;
                case 'rectangle':
                    this.drawRectangle(drawing);
                    break;
                case 'text':
                    this.drawText(drawing);
                    break;
                case 'highlight':
                    this.drawHighlight(drawing);
                    break;
                default:
                    console.warn('Tipo de dibujo no reconocido:', drawing.type);
            }
        });
    }

    drawHighlight(highlight) {
        const { bounds, color, width } = highlight;

        if (!bounds) return;

        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = width;
        this.ctx.shadowColor = color;
        this.ctx.shadowBlur = 10;

        this.ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);

        // Efecto de pulso sutil
        this.ctx.strokeStyle = color + '40';
        this.ctx.lineWidth = width + 4;
        this.ctx.strokeRect(bounds.x - 2, bounds.y - 2, bounds.width + 4, bounds.height + 4);

        this.ctx.restore();
    }

    clearCanvas() {
        console.log('🧹 Limpiando canvas - drawings antes:', this.drawings.length);
        console.log('🧹 Limpiando canvas - animations antes:', this.animations.length);

        this.drawings = [];
        this.animations = [];

        // Forzar limpieza completa del canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Doble limpieza para asegurar que no queda nada
        this.ctx.fillStyle = 'transparent';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        console.log('✅ Canvas limpiado completamente');
    }

    clearElement(id) {
        this.drawings = this.drawings.filter(drawing => drawing.id !== id);
        this.redrawAll();
    }

    startAnimationLoop() {
        const animate = () => {
            // Actualizar animaciones
            const currentTime = Date.now();

            this.animations = this.animations.filter(animation => {
                const elapsed = currentTime - animation.timestamp;
                return elapsed < animation.duration * animation.iterations;
            });

            // Redibujar si hay animaciones activas
            if (this.animations.length > 0) {
                this.redrawAll();
            }

            requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }

    startAnimation(animation) {
        // Implementar diferentes tipos de animación
        switch (animation.type) {
            case 'pulse':
                this.startPulseAnimation(animation);
                break;
            case 'fade':
                this.startFadeAnimation(animation);
                break;
            case 'slide':
                this.startSlideAnimation(animation);
                break;
        }
    }

    startPulseAnimation(animation) {
        const targetElement = this.drawings.find(d => d.id === animation.target);
        if (!targetElement) return;

        const startTime = Date.now();
        const pulse = () => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed % animation.duration) / animation.duration;
            const scale = 1 + Math.sin(progress * Math.PI * 2) * 0.1;

            // Aplicar transformación de escala
            targetElement.scale = scale;

            if (elapsed < animation.duration * animation.iterations) {
                requestAnimationFrame(pulse);
            } else {
                delete targetElement.scale;
                this.redrawAll();
            }
        };

        pulse();
    }

    updateConnectionStatus(connected) {
        this.isConnected = connected;
        const statusIndicator = document.getElementById('connection-status');
        const statusText = document.getElementById('status-text');

        if (connected) {
            statusIndicator.classList.remove('status-disconnected');
            statusIndicator.classList.add('status-connected');
            statusText.textContent = 'Conectado';
        } else {
            statusIndicator.classList.remove('status-connected');
            statusIndicator.classList.add('status-disconnected');
            statusText.textContent = 'Desconectado';
        }
    }

    generateId() {
        return 'overlay_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
}

// Inicializar el overlay cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    window.aiOverlay = new AIOverlay();

    // Enviar señal de que el overlay está listo
    if (window.electronAPI) {
        window.electronAPI.sendOverlayReady();
    }
});

// Para pruebas en navegador
if (!window.electronAPI) {
    // Simular comandos para pruebas
    window.testAICommands = () => {
        const testCommands = [
            {
                action: 'arrow',
                from: [100, 100],
                to: [300, 200],
                color: '#ff4081'
            },
            {
                action: 'circle',
                center: [400, 150],
                radius: 50,
                color: '#4caf50',
                fill: true,
                fillColor: 'rgba(76, 175, 80, 0.2)'
            },
            {
                action: 'text',
                text: 'AI Overlay Activo',
                position: [400, 300],
                color: '#ffffff',
                backgroundColor: 'rgba(33, 33, 33, 0.9)'
            }
        ];

        testCommands.forEach((command, index) => {
            setTimeout(() => {
                window.aiOverlay.handleCommand(command);
            }, index * 1000);
        });
    };

    console.log('Modo prueba activado. Ejecuta testAICommands() para ver ejemplos.');
}