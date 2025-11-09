# Ejemplos Prácticos - AI Browser Overlay

## Tabla de Contenidos

- [Tutorial Interactivo](#tutorial-interactivo)
- [Asistente de Accesibilidad](#asistente-de-accesibilidad)
- [Demo de E-commerce](#demo-de-e-commerce)
- [Form Wizard](#form-wizard)
- [Análisis SEO](#análisis-seo)
- [Testing Automatizado](#testing-automatizado)
- [Presentaciones Guiadas](#presentaciones-guiadas)

## Tutorial Interactivo

### Objetivo
Guía paso a paso para que los usuarios aprendan a usar una aplicación web.

### Implementación

```javascript
class InteractiveTutorial {
  constructor() {
    this.steps = [
      {
        title: "¡Bienvenido!",
        content: "Vamos a explorar las funciones principales de esta aplicación.",
        position: [window.innerWidth / 2, 100],
        highlight: null,
        action: null
      },
      {
        title: "Paso 1: Navegación",
        content: "El menú principal está aquí. Puedes acceder a todas las secciones.",
        position: [200, 80],
        highlight: ".main-navigation",
        action: "hover"
      },
      {
        title: "Paso 2: Búsqueda",
        content: "Usa la barra de búsqueda para encontrar contenido rápidamente.",
        position: [400, 120],
        highlight: "#search-input",
        action: "focus"
      },
      {
        title: "Paso 3: Acciones",
        content: "Este botón te permite crear nuevo contenido.",
        position: [600, 300],
        highlight: ".create-button",
        action: "click"
      },
      {
        title: "¡Listo!",
        content: "Ahora puedes explorar la aplicación por tu cuenta.",
        position: [window.innerWidth / 2, 400],
        highlight: null,
        action: null
      }
    ];

    this.currentStep = 0;
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentStep = 0;
    this.showStep(this.currentStep);
  }

  showStep(stepIndex) {
    if (stepIndex >= this.steps.length) {
      this.complete();
      return;
    }

    const step = this.steps[stepIndex];

    // Limpiar elementos anteriores
    this.clearPreviousElements();

    // Mostrar título del paso
    this.showTitle(step.title, step.position);

    // Mostrar contenido
    this.showContent(step.content, step.position);

    // Resaltar elemento si es necesario
    if (step.highlight) {
      this.highlightElement(step.highlight);
    }

    // Ejecutar acción si es necesario
    if (step.action) {
      this.executeAction(step.action, step.highlight);
    }

    // Añadir controles de navegación
    this.showNavigationControls(stepIndex);
  }

  showTitle(title, position) {
    sendCommand({
      action: "text",
      text: title,
      position: [position[0], position[1] - 40],
      color: "#ffffff",
      backgroundColor: "rgba(103, 58, 183, 0.9)",
      fontSize: 24,
      fontFamily: "Arial, sans-serif",
      padding: 12,
      borderRadius: 8,
      id: "tutorial-title"
    });
  }

  showContent(content, position) {
    sendCommand({
      action: "text",
      text: content,
      position: [position[0], position[1]],
      color: "#333333",
      backgroundColor: "rgba(255, 255, 255, 0.95)",
      fontSize: 16,
      fontFamily: "Arial, sans-serif",
      padding: 15,
      borderRadius: 6,
      id: "tutorial-content"
    });
  }

  highlightElement(selector) {
    sendCommand({
      action: "highlight",
      selector: selector,
      style: {
        outline: "3px solid #ff4081",
        boxShadow: "0 0 20px rgba(255, 64, 129, 0.4)",
        backgroundColor: "rgba(255, 64, 129, 0.1)"
      },
      options: {
        addIndicator: true
      },
      id: "tutorial-highlight"
    });

    // Añadir flecha indicadora
    const element = document.querySelector(selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      const arrowStart = [rect.left + rect.width / 2, rect.top - 50];
      const arrowEnd = [rect.left + rect.width / 2, rect.top - 10];

      sendCommand({
        action: "arrow",
        from: arrowStart,
        to: arrowEnd,
        color: "#ff4081",
        width: 3,
        animated: true,
        id: "tutorial-arrow"
      });
    }
  }

  executeAction(action, selector) {
    switch (action) {
      case "hover":
        sendCommand({
          action: "modify_style",
          selector: selector,
          styles: {
            transform: "scale(1.05)",
            transition: "transform 0.3s ease"
          }
        });
        break;

      case "focus":
        sendCommand({
          action: "click_element",
          selector: selector
        });
        break;

      case "click":
        // Simular clic después de un retraso
        setTimeout(() => {
          sendCommand({
            action: "click_element",
            selector: selector
          });
        }, 2000);
        break;
    }
  }

  showNavigationControls(stepIndex) {
    const buttonY = 150;
    const centerX = window.innerWidth / 2;

    // Botón Anterior
    if (stepIndex > 0) {
      sendCommand({
        action: "text",
        text: "← Anterior",
        position: [centerX - 120, buttonY],
        color: "#ffffff",
        backgroundColor: "rgba(158, 158, 158, 0.8)",
        fontSize: 14,
        padding: 8,
        borderRadius: 4,
        id: "tutorial-prev"
      });
    }

    // Botón Siguiente
    const nextText = stepIndex < this.steps.length - 1 ? "Siguiente →" : "Completar ✓";
    sendCommand({
      action: "text",
      text: nextText,
      position: [centerX + 40, buttonY],
      color: "#ffffff",
      backgroundColor: "rgba(76, 175, 80, 0.8)",
      fontSize: 14,
      padding: 8,
      borderRadius: 4,
      id: "tutorial-next"
    });

    // Indicador de progreso
    sendCommand({
      action: "text",
      text: `Paso ${stepIndex + 1} de ${this.steps.length}`,
      position: [centerX - 50, buttonY + 40],
      color: "#666666",
      fontSize: 12,
      id: "tutorial-progress"
    });
  }

  nextStep() {
    this.currentStep++;
    this.showStep(this.currentStep);
  }

  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this.showStep(this.currentStep);
    }
  }

  clearPreviousElements() {
    sendCommand({
      action: "clear",
      type: "overlay"
    });
  }

  complete() {
    this.clearPreviousElements();

    sendCommand({
      action: "text",
      text: "🎉 ¡Tutorial completado!",
      position: [window.innerWidth / 2, window.innerHeight / 2],
      color: "#ffffff",
      backgroundColor: "rgba(76, 175, 80, 0.9)",
      fontSize: 28,
      padding: 20,
      borderRadius: 10,
      id: "tutorial-complete"
    });

    setTimeout(() => {
      sendCommand({ action: "clear", type: "overlay" });
    }, 3000);

    this.isRunning = false;
  }

  // Manejar clics en los botones de navegación
  handleClick(x, y) {
    const centerX = window.innerWidth / 2;
    const buttonY = 150;

    // Verificar clic en botón siguiente
    if (x >= centerX + 40 && x <= centerX + 140 &&
        y >= buttonY && y <= buttonY + 30) {
      this.nextStep();
    }

    // Verificar clic en botón anterior
    if (this.currentStep > 0 &&
        x >= centerX - 120 && x <= centerX - 20 &&
        y >= buttonY && y <= buttonY + 30) {
      this.prevStep();
    }
  }
}

// Uso del tutorial
const tutorial = new InteractiveTutorial();
tutorial.start();
```

## Asistente de Accesibilidad

### Objetivo
Analizar y mejorar la accesibilidad de una página web en tiempo real.

### Implementación

```javascript
class AccessibilityAssistant {
  constructor() {
    this.issues = [];
    this.score = 10;
    this.analyzers = [
      this.checkImageAltText.bind(this),
      this.checkHeadingStructure.bind(this),
      this.checkColorContrast.bind(this),
      this.checkFormLabels.bind(this),
      this.checkLinkText.bind(this),
      this.checkKeyboardNavigation.bind(this)
    ];
  }

  async runAnalysis() {
    console.log("🔍 Iniciando análisis de accesibilidad...");

    // Limpiar análisis anterior
    this.clearPreviousAnalysis();

    // Obtener datos de la página
    const domData = await this.getPageData();

    // Ejecutar todos los analizadores
    for (const analyzer of this.analyzers) {
      const issues = await analyzer(domData);
      this.issues.push(...issues);
    }

    // Calcular puntuación
    this.calculateScore();

    // Mostrar resultados
    this.displayResults();

    // Aplicar mejoras automáticas
    this.applyAutoFixes();
  }

  async getPageData() {
    // Capturar pantalla para análisis visual
    await sendCommand({ action: "capture" });

    // Obtener estructura DOM
    return await sendCommand({ action: "get_dom" });
  }

  checkImageAltText(domData) {
    const issues = [];
    const images = domData.data.elements.filter(el => el.tagName === "IMG");

    images.forEach((img, index) => {
      if (!img.attributes.alt) {
        issues.push({
          type: "missing_alt",
          severity: "error",
          element: img,
          selector: `img:nth-of-type(${index + 1})`,
          message: "La imagen no tiene atributo alt",
          suggestion: "Añade un atributo alt descriptivo"
        });
      } else if (img.attributes.alt.trim() === "") {
        issues.push({
          type: "empty_alt",
          severity: "warning",
          element: img,
          selector: `img:nth-of-type(${index + 1})`,
          message: "La imagen tiene un atributo alt vacío",
          suggestion: "Describe el contenido de la imagen o usa alt='\"\"' si es decorativa"
        });
      }
    });

    return issues;
  }

  checkHeadingStructure(domData) {
    const issues = [];
    const headings = domData.data.elements.filter(el => /^H[1-6]$/.test(el.tagName));

    // Verificar que haya un H1
    const h1Count = headings.filter(h => h.tagName === "H1").length;
    if (h1Count === 0) {
      issues.push({
        type: "no_h1",
        severity: "error",
        message: "No hay encabezados H1 en la página",
        suggestion: "Añade un H1 que describa el contenido principal"
      });
    } else if (h1Count > 1) {
      issues.push({
        type: "multiple_h1",
        severity: "warning",
        message: "Hay múltiples encabezados H1",
        suggestion: "Usa un solo H1 por página"
      });
    }

    // Verificar estructura jerárquica
    let previousLevel = 0;
    headings.forEach(heading => {
      const currentLevel = parseInt(heading.tagName.substring(1));

      if (currentLevel > previousLevel + 1) {
        issues.push({
          type: "heading_hierarchy",
          severity: "warning",
          element: heading,
          message: `Salto de encabezado de H${previousLevel} a H${currentLevel}`,
          suggestion: "Mantén una estructura jerárquica lógica"
        });
      }

      previousLevel = currentLevel;
    });

    return issues;
  }

  checkColorContrast(domData) {
    const issues = [];

    // Simulación de análisis de contraste
    // En una implementación real, usaríamos una librería como tinycolor2

    const elementsWithText = domData.data.elements.filter(el =>
      el.textContent && el.textContent.trim().length > 0
    );

    elementsWithText.forEach((element, index) => {
      // Simulación: suponemos que algunos elementos tienen bajo contraste
      if (Math.random() < 0.1) { // 10% de probabilidad de encontrar problema
        issues.push({
          type: "low_contrast",
          severity: "warning",
          element: element,
          selector: `*:nth-child(${index + 1})`,
          message: "Posible problema de contraste de color",
          suggestion: "Verifica que el texto tenga suficiente contraste con el fondo"
        });
      }
    });

    return issues;
  }

  checkFormLabels(domData) {
    const issues = [];
    const formElements = domData.data.elements.filter(el =>
      ["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)
    );

    formElements.forEach((element, index) => {
      const hasLabel = element.attributes["aria-label"] ||
                      element.attributes["aria-labelledby"] ||
                      element.id; // Simplificado

      if (!hasLabel && element.attributes.type !== "hidden") {
        issues.push({
          type: "missing_label",
          severity: "error",
          element: element,
          selector: `input:nth-of-type(${index + 1})`,
          message: "El campo de formulario no tiene etiqueta",
          suggestion: "Añade una etiqueta usando <label> o atributos aria"
        });
      }

      // Verificar campos requeridos
      if (element.attributes.required) {
        issues.push({
          type: "required_field",
          severity: "info",
          element: element,
          selector: `input:nth-of-type(${index + 1})`,
          message: "Campo requerido detectado",
          suggestion: "Asegúrate de indicar visualmente que es obligatorio"
        });
      }
    });

    return issues;
  }

  checkLinkText(domData) {
    const issues = [];
    const links = domData.data.elements.filter(el => el.tagName === "A");

    links.forEach((link, index) => {
      const linkText = link.textContent ? link.textContent.trim() : "";

      if (linkText.length === 0 && !link.attributes["aria-label"]) {
        issues.push({
          type: "empty_link",
          severity: "error",
          element: link,
          selector: `a:nth-of-type(${index + 1})`,
          message: "Enlace sin texto descriptivo",
          suggestion: "Añade texto descriptivo o aria-label"
        });
      }

      if (/^hacer clic aquí$/i.test(linkText) ||
          /^clic aquí$/i.test(linkText) ||
          /^más información$/i.test(linkText)) {
        issues.push({
          type: "generic_link_text",
          severity: "warning",
          element: link,
          selector: `a:nth-of-type(${index + 1})`,
          message: "Texto de enlace genérico",
          suggestion: "Usa texto más descriptivo que indique el destino"
        });
      }
    });

    return issues;
  }

  checkKeyboardNavigation(domData) {
    const issues = [];

    // Verificar elementos interactivos
    const interactiveElements = domData.data.elements.filter(el =>
      ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(el.tagName) ||
      el.attributes.tabindex
    );

    if (interactiveElements.length === 0) {
      issues.push({
        type: "no_keyboard_navigation",
        severity: "error",
        message: "No se encontraron elementos navegables por teclado",
        suggestion: "Asegúrate de que todos los elementos interactivos sean accesibles por teclado"
      });
    }

    return issues;
  }

  calculateScore() {
    this.score = 10;

    this.issues.forEach(issue => {
      if (issue.severity === "error") {
        this.score -= 2;
      } else if (issue.severity === "warning") {
        this.score -= 1;
      }
    });

    this.score = Math.max(0, this.score);
  }

  displayResults() {
    // Mostrar puntuación general
    const scoreColor = this.getScoreColor(this.score);

    sendCommand({
      action: "text",
      text: `♿ Accesibilidad: ${this.score}/10`,
      position: [10, 10],
      color: "#ffffff",
      backgroundColor: scoreColor,
      fontSize: 18,
      padding: 10,
      borderRadius: 6,
      id: "accessibility-score"
    });

    // Mostrar resumen de problemas
    const errorCount = this.issues.filter(i => i.severity === "error").length;
    const warningCount = this.issues.filter(i => i.severity === "warning").length;

    sendCommand({
      action: "text",
      text: `❌ ${errorCount} errores | ⚠️ ${warningCount} advertencias`,
      position: [10, 50],
      color: "#ffffff",
      backgroundColor: "rgba(33, 33, 33, 0.8)",
      fontSize: 14,
      padding: 8,
      borderRadius: 4,
      id: "accessibility-summary"
    });

    // Resaltar problemas en la página
    this.highlightIssues();

    // Mostrar panel de detalles
    this.showIssueDetails();
  }

  getScoreColor(score) {
    if (score >= 8) return "rgba(76, 175, 80, 0.9)";
    if (score >= 6) return "rgba(255, 152, 0, 0.9)";
    return "rgba(244, 67, 54, 0.9)";
  }

  highlightIssues() {
    this.issues.forEach((issue, index) => {
      if (issue.selector) {
        const color = this.getIssueColor(issue.severity);

        sendCommand({
          action: "highlight",
          selector: issue.selector,
          style: {
            outline: `2px solid ${color}`,
            backgroundColor: `${color}20`,
            boxShadow: `0 0 8px ${color}60`
          },
          id: `issue-highlight-${index}`
        });

        // Añadir indicador
        const indicatorSymbol = issue.severity === "error" ? "❌" : "⚠️";
        sendCommand({
          action: "text",
          text: indicatorSymbol,
          position: [issue.element.boundingBox?.x || 0,
                     (issue.element.boundingBox?.y || 0) - 25],
          color: "#ffffff",
          backgroundColor: color,
          fontSize: 12,
          padding: 2,
          borderRadius: 10,
          id: `issue-indicator-${index}`
        });
      }
    });
  }

  getIssueColor(severity) {
    switch (severity) {
      case "error": return "#f44336";
      case "warning": return "#ff9800";
      case "info": return "#2196f3";
      default: return "#666666";
    }
  }

  showIssueDetails() {
    const startY = 100;
    let currentY = startY;

    this.issues.slice(0, 5).forEach((issue, index) => {
      const icon = issue.severity === "error" ? "❌" :
                   issue.severity === "warning" ? "⚠️" : "ℹ️";

      sendCommand({
        action: "text",
        text: `${icon} ${issue.message}`,
        position: [10, currentY],
        color: "#ffffff",
        backgroundColor: "rgba(33, 33, 33, 0.9)",
        fontSize: 12,
        padding: 6,
        borderRadius: 4,
        id: `issue-detail-${index}`
      });

      currentY += 25;
    });

    if (this.issues.length > 5) {
      sendCommand({
        action: "text",
        text: `... y ${this.issues.length - 5} problemas más`,
        position: [10, currentY],
        color: "#ffffff",
        backgroundColor: "rgba(33, 33, 33, 0.7)",
        fontSize: 11,
        padding: 4,
        borderRadius: 4,
        id: "more-issues"
      });
    }
  }

  applyAutoFixes() {
    // Mejoras automáticas simples
    this.issues.forEach(issue => {
      switch (issue.type) {
        case "required_field":
          // Añadir indicador visual de campo requerido
          sendCommand({
            action: "inject_element",
            selector: issue.selector,
            element: {
              tag: "span",
              text: " *",
              attributes: {
                "aria-label": "Campo requerido",
                "style": "color: #f44336; font-weight: bold;"
              }
            },
            position: "afterend"
          });
          break;

        case "missing_alt":
          // Añadir placeholder para alt
          sendCommand({
            action: "text",
            text: "📷 Añade descripción",
            position: [
              (issue.element.boundingBox?.x || 0) + 10,
              (issue.element.boundingBox?.y || 0) + 10
            ],
            color: "#ffffff",
            backgroundColor: "rgba(244, 67, 54, 0.8)",
            fontSize: 10,
            id: "alt-placeholder"
          });
          break;
      }
    });
  }

  clearPreviousAnalysis() {
    sendCommand({
      action: "clear",
      type: "overlay"
    });
    this.issues = [];
    this.score = 10;
  }

  generateReport() {
    const report = {
      score: this.score,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      issues: this.issues,
      summary: {
        total: this.issues.length,
        errors: this.issues.filter(i => i.severity === "error").length,
        warnings: this.issues.filter(i => i.severity === "warning").length,
        info: this.issues.filter(i => i.severity === "info").length
      },
      recommendations: this.getRecommendations()
    };

    // Descargar reporte como JSON
    const blob = new Blob([JSON.stringify(report, null, 2)],
                         { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accessibility-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    return report;
  }

  getRecommendations() {
    const recommendations = [];

    if (this.issues.some(i => i.type === "missing_alt")) {
      recommendations.push({
        priority: "high",
        title: "Añadir texto alternativo a imágenes",
        description: "Todas las imágenes informativas deben tener un atributo alt descriptivo."
      });
    }

    if (this.issues.some(i => i.type === "no_h1")) {
      recommendations.push({
        priority: "high",
        title: "Mejorar estructura de encabezados",
        description: "Usa un único H1 por página y mantén una jerarquía lógica."
      });
    }

    if (this.issues.some(i => i.type === "low_contrast")) {
      recommendations.push({
        priority: "medium",
        title: "Mejorar contraste de colores",
        description: "Asegúrate que el texto tenga un contraste mínimo de 4.5:1 con el fondo."
      });
    }

    return recommendations;
  }
}

// Uso del asistente de accesibilidad
const accessibilityAssistant = new AccessibilityAssistant();

// Iniciar análisis
accessibilityAssistant.runAnalysis();

// Generar reporte completo
setTimeout(() => {
  accessibilityAssistant.generateReport();
}, 5000);
```

## Demo de E-commerce

### Objetivo
Guía de compra inteligente con análisis de productos y comparaciones.

### Implementación

```javascript
class EcommerceAssistant {
  constructor() {
    this.products = [];
    this.comparisonMode = false;
    this.selectedProducts = [];
  }

  async analyzeProductPage() {
    console.log("🛒 Analizando página de productos...");

    // Identificar productos en la página
    await this.identifyProducts();

    // Analizar características de cada producto
    await this.analyzeProductFeatures();

    // Mostrar asistente de compra
    this.showShoppingAssistant();

    // Configurar modo comparación
    this.setupComparisonMode();
  }

  async identifyProducts() {
    const domData = await sendCommand({ action: "get_dom" });

    // Buscar contenedores de productos (patrones comunes)
    const productSelectors = [
      ".product",
      ".item",
      "[data-product]",
      ".product-card",
      ".product-item"
    ];

    for (const selector of productSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((element, index) => {
        const product = this.extractProductInfo(element, index);
        if (product.isValid) {
          this.products.push(product);
        }
      });
    }

    // Resaltar productos encontrados
    this.products.forEach((product, index) => {
      sendCommand({
        action: "highlight",
        selector: product.selector,
        style: {
          outline: "2px solid #4caf50",
          backgroundColor: "rgba(76, 175, 80, 0.1)"
        },
        id: `product-highlight-${index}`
      });

      // Añadir etiqueta de producto
      const rect = element.getBoundingClientRect();
      sendCommand({
        action: "text",
        text: `📦 Producto ${index + 1}`,
        position: [rect.left, rect.top - 20],
        color: "#ffffff",
        backgroundColor: "rgba(76, 175, 80, 0.9)",
        fontSize: 12,
        id: `product-label-${index}`
      });
    });

    console.log(`Se encontraron ${this.products.length} productos`);
  }

  extractProductInfo(element, index) {
    const product = {
      id: index,
      selector: `*:nth-child(${index + 1})`,
      isValid: false,
      name: "",
      price: null,
      rating: null,
      availability: null,
      features: []
    };

    // Extraer nombre
    const nameElement = element.querySelector("h2, h3, .title, .name");
    if (nameElement) {
      product.name = nameElement.textContent.trim();
      product.isValid = true;
    }

    // Extraer precio
    const priceElement = element.querySelector(".price, .cost, [data-price]");
    if (priceElement) {
      const priceText = priceElement.textContent.replace(/[^0-9.,]/g, "");
      product.price = parseFloat(priceText.replace(",", "."));
    }

    // Extraer rating
    const ratingElement = element.querySelector(".rating, .stars, [data-rating]");
    if (ratingElement) {
      const ratingText = ratingElement.textContent.match(/[\d.]+/);
      if (ratingText) {
        product.rating = parseFloat(ratingText[0]);
      }
    }

    // Verificar disponibilidad
    const availabilityElement = element.querySelector(".stock, .availability");
    if (availabilityElement) {
      product.availability = availabilityElement.textContent.toLowerCase().includes("stock");
    }

    return product;
  }

  async analyzeProductFeatures() {
    for (const product of this.products) {
      // Análisis de precio
      if (product.price) {
        product.priceCategory = this.categorizePrice(product.price);
        product.isGoodPrice = await this.evaluatePrice(product);
      }

      // Análisis de rating
      if (product.rating) {
        product.ratingQuality = this.evaluateRating(product.rating);
      }

      // Características adicionales
      product.recommendationScore = this.calculateRecommendationScore(product);
    }

    // Ordenar productos por recomendación
    this.products.sort((a, b) => b.recommendationScore - a.recommendationScore);
  }

  categorizePrice(price) {
    const avgPrice = this.products
      .filter(p => p.price)
      .reduce((sum, p) => sum + p.price, 0) / this.products.filter(p => p.price).length;

    if (price < avgPrice * 0.8) return "economico";
    if (price > avgPrice * 1.2) return "premium";
    return "estandar";
  }

  async evaluatePrice(product) {
    // Simulación de evaluación de precio
    // En una implementación real, podríamos comparar con otras tiendas
    return Math.random() > 0.5; // 50% de probabilidad de buen precio
  }

  evaluateRating(rating) {
    if (rating >= 4.5) return "excelente";
    if (rating >= 4.0) return "muy_bueno";
    if (rating >= 3.5) return "bueno";
    if (rating >= 3.0) return "regular";
    return "bajo";
  }

  calculateRecommendationScore(product) {
    let score = 0;

    // Precio (40%)
    if (product.isGoodPrice) score += 40;
    else if (product.priceCategory === "economico") score += 30;

    // Rating (35%)
    if (product.rating) {
      score += (product.rating / 5) * 35;
    }

    // Disponibilidad (15%)
    if (product.availability !== false) score += 15;

    // Completitud de información (10%)
    if (product.name && product.price) score += 10;

    return Math.min(100, score);
  }

  showShoppingAssistant() {
    const bestProduct = this.products[0];

    // Mostrar mejor recomendación
    sendCommand({
      action: "text",
      text: "🏆 Mejor Opción Recomendada",
      position: [window.innerWidth / 2 - 100, 50],
      color: "#ffffff",
      backgroundColor: "rgba(255, 193, 7, 0.9)",
      fontSize: 20,
      padding: 15,
      borderRadius: 8,
      id: "best-recommendation"
    });

    // Resaltar mejor producto
    sendCommand({
      action: "highlight",
      selector: bestProduct.selector,
      style: {
        outline: "4px solid #ffc107",
        boxShadow: "0 0 25px rgba(255, 193, 7, 0.6)",
        backgroundColor: "rgba(255, 193, 7, 0.2)"
      },
      id: "best-product-highlight"
    });

    // Mostrar panel de análisis
    this.showAnalysisPanel();
  }

  showAnalysisPanel() {
    const panelX = window.innerWidth - 300;
    let currentY = 100;

    // Título del panel
    sendCommand({
      action: "text",
      text: "📊 Análisis de Productos",
      position: [panelX, currentY],
      color: "#ffffff",
      backgroundColor: "rgba(33, 33, 33, 0.9)",
      fontSize: 16,
      padding: 10,
      borderRadius: 6,
      id: "analysis-title"
    });

    currentY += 40;

    // Mostrar top 3 productos
    this.products.slice(0, 3).forEach((product, index) => {
      const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉";

      sendCommand({
        action: "text",
        text: `${medal} ${product.name.substring(0, 25)}${product.name.length > 25 ? "..." : ""}`,
        position: [panelX, currentY],
        color: "#ffffff",
        backgroundColor: "rgba(33, 33, 33, 0.8)",
        fontSize: 12,
        padding: 6,
        borderRadius: 4,
        id: `product-${index}`
      });

      // Puntuación
      sendCommand({
        action: "text",
        text: `⭐ ${product.recommendationScore.toFixed(1)}/100`,
        position: [panelX, currentY + 20],
        color: "#ffc107",
        fontSize: 10,
        id: `score-${index}`
      });

      currentY += 45;
    });

    // Botón de comparación
    sendCommand({
      action: "text",
      text: "🔄 Comparar Productos",
      position: [panelX, currentY + 20],
      color: "#ffffff",
      backgroundColor: "rgba(33, 150, 243, 0.8)",
      fontSize: 12,
      padding: 8,
      borderRadius: 4,
      id: "compare-button"
    });
  }

  setupComparisonMode() {
    // Habilitar selección de productos para comparar
    this.comparisonMode = true;

    // Añadir listeners para clics en productos
    document.addEventListener("click", (e) => {
      if (this.comparisonMode) {
        const productElement = e.target.closest("[data-product], .product, .item");
        if (productElement) {
          this.toggleProductComparison(productElement);
        }
      }
    });

    // Instrucciones
    sendCommand({
      action: "text",
      text: "💡 Haz clic en los productos para agregarlos a la comparación",
      position: [window.innerWidth / 2 - 150, window.innerHeight - 50],
      color: "#ffffff",
      backgroundColor: "rgba(33, 33, 33, 0.8)",
      fontSize: 14,
      padding: 10,
      borderRadius: 6,
      id: "comparison-instructions"
    });
  }

  toggleProductComparison(element) {
    const productId = Array.from(element.parentNode.children).indexOf(element);
    const product = this.products[productId];

    if (!product) return;

    const index = this.selectedProducts.findIndex(p => p.id === productId);

    if (index === -1) {
      // Agregar a comparación
      if (this.selectedProducts.length < 3) {
        this.selectedProducts.push(product);
        this.markProductForComparison(element, true);
      } else {
        this.showMessage("Máximo 3 productos para comparar");
      }
    } else {
      // Quitar de comparación
      this.selectedProducts.splice(index, 1);
      this.markProductForComparison(element, false);
    }

    // Actualizar botón de comparación
    this.updateCompareButton();
  }

  markProductForComparison(element, selected) {
    const productIndex = Array.from(element.parentNode.children).indexOf(element);

    if (selected) {
      sendCommand({
        action: "highlight",
        selector: `*:nth-child(${productIndex + 1})`,
        style: {
          outline: "3px solid #2196f3",
          backgroundColor: "rgba(33, 150, 243, 0.2)"
        },
        id: `compare-selected-${productIndex}`
      });

      // Número de selección
      const rect = element.getBoundingClientRect();
      sendCommand({
        action: "text",
        text: `${this.selectedProducts.length}`,
        position: [rect.right - 15, rect.top + 5],
        color: "#ffffff",
        backgroundColor: "#2196f3",
        fontSize: 12,
        padding: 2,
        borderRadius: 10,
        id: `compare-number-${productIndex}`
      });
    } else {
      sendCommand({
        action: "clear_element",
        id: `compare-selected-${productIndex}`
      });
      sendCommand({
        action: "clear_element",
        id: `compare-number-${productIndex}`
      });
    }
  }

  updateCompareButton() {
    sendCommand({
      action: "clear_element",
      id: "compare-button"
    });

    const buttonText = this.selectedProducts.length >= 2 ?
      `🔄 Comparar (${this.selectedProducts.length})` :
      "🔄 Comparar Productos";

    const buttonColor = this.selectedProducts.length >= 2 ?
      "rgba(76, 175, 80, 0.8)" :
      "rgba(33, 150, 243, 0.8)";

    sendCommand({
      action: "text",
      text: buttonText,
      position: [window.innerWidth - 300, 250],
      color: "#ffffff",
      backgroundColor: buttonColor,
      fontSize: 12,
      padding: 8,
      borderRadius: 4,
      id: "compare-button"
    });

    if (this.selectedProducts.length >= 2) {
      // Habilitar clic en botón de comparación
      this.enableComparison();
    }
  }

  enableComparison() {
    // Mostrar tabla de comparación
    this.showComparisonTable();
  }

  showComparisonTable() {
    sendCommand({
      action: "clear",
      type: "overlay"
    });

    const startX = 100;
    const startY = 100;
    const columnWidth = 200;
    const rowHeight = 40;

    // Título
    sendCommand({
      action: "text",
      text: "📊 Tabla Comparativa",
      position: [startX + 150, startY - 30],
      color: "#ffffff",
      backgroundColor: "rgba(33, 33, 33, 0.9)",
      fontSize: 18,
      padding: 10,
      borderRadius: 6,
      id: "comparison-title"
    });

    // Encabezados
    const headers = ["Característica", ...this.selectedProducts.map(p => p.name.substring(0, 15))];
    headers.forEach((header, index) => {
      sendCommand({
        action: "text",
        text: header,
        position: [startX + index * columnWidth, startY],
        color: "#ffffff",
        backgroundColor: "rgba(33, 150, 243, 0.8)",
        fontSize: 12,
        padding: 8,
        borderRadius: 4,
        id: `header-${index}`
      });
    });

    // Filas de características
    const features = [
      { key: "price", label: "Precio" },
      { key: "rating", label: "Rating" },
      { key: "recommendationScore", label: "Puntuación" },
      { key: "availability", label: "Disponibilidad" }
    ];

    features.forEach((feature, rowIndex) => {
      const y = startY + (rowIndex + 1) * rowHeight;

      // Etiqueta de característica
      sendCommand({
        action: "text",
        text: feature.label,
        position: [startX, y],
        color: "#ffffff",
        backgroundColor: "rgba(33, 33, 33, 0.7)",
        fontSize: 11,
        padding: 6,
        borderRadius: 3,
        id: `feature-label-${rowIndex}`
      });

      // Valores para cada producto
      this.selectedProducts.forEach((product, colIndex) => {
        const x = startX + (colIndex + 1) * columnWidth;
        let value = this.formatFeatureValue(product[feature.key], feature.key);

        sendCommand({
          action: "text",
          text: value,
          position: [x, y],
          color: "#ffffff",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          fontSize: 11,
          padding: 6,
          borderRadius: 3,
          id: `feature-value-${rowIndex}-${colIndex}`
        });
      });
    });

    // Recomendación final
    const bestProduct = this.selectedProducts.reduce((best, current) =>
      current.recommendationScore > best.recommendationScore ? current : best
    );

    sendCommand({
      action: "text",
      text: `🏆 Mejor opción: ${bestProduct.name}`,
      position: [startX + 100, startY + (features.length + 2) * rowHeight],
      color: "#ffffff",
      backgroundColor: "rgba(255, 193, 7, 0.9)",
      fontSize: 14,
      padding: 10,
      borderRadius: 6,
      id: "final-recommendation"
    });
  }

  formatFeatureValue(value, key) {
    switch (key) {
      case "price":
        return value ? `$${value.toFixed(2)}` : "N/A";
      case "rating":
        return value ? `${value.toFixed(1)} ⭐` : "N/A";
      case "recommendationScore":
        return value ? `${value.toFixed(1)}/100` : "N/A";
      case "availability":
        return value !== false ? "✅ Disponible" : "❌ Agotado";
      default:
        return value || "N/A";
    }
  }

  showMessage(message) {
    sendCommand({
      action: "text",
      text: message,
      position: [window.innerWidth / 2 - 100, window.innerHeight / 2],
      color: "#ffffff",
      backgroundColor: "rgba(244, 67, 54, 0.9)",
      fontSize: 14,
      padding: 10,
      borderRadius: 6,
      id: "error-message"
    });

    setTimeout(() => {
      sendCommand({ action: "clear_element", id: "error-message" });
    }, 3000);
  }
}

// Uso del asistente de e-commerce
const ecommerceAssistant = new EcommerceAssistant();

// Iniciar análisis cuando la página esté lista
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => ecommerceAssistant.analyzeProductPage(), 1000);
  });
} else {
  setTimeout(() => ecommerceAssistant.analyzeProductPage(), 1000);
}
```

---

Estos ejemplos demuestran el potencial del sistema AI Browser Overlay para diversas aplicaciones prácticas desde educación hasta comercio electrónico. Cada ejemplo puede adaptarse y extenderse según necesidades específicas.