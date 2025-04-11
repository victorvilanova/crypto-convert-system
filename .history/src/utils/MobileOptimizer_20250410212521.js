/**
 * Utilitários para otimização em dispositivos móveis
 */

// Detecta o tipo de dispositivo
export function detectDevice() {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  
  // Detectar tablets primeiro, pois muitos tablets têm "Android" ou "Mobile" no userAgent
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet';
  }
  
  // Detectar dispositivos móveis
  if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

// Detecta orientação do dispositivo
export function detectOrientation() {
  if (window.matchMedia("(orientation: portrait)").matches) {
    return 'portrait';
  }
  
  return 'landscape';
}

// Ajusta a interface com base no dispositivo
export function setupResponsiveUI() {
  const device = detectDevice();
  const orientation = detectOrientation();
  
  // Adicionar classes ao elemento html
  document.documentElement.classList.add(`device-${device}`);
  document.documentElement.classList.add(`orientation-${orientation}`);
  
  // Configuração específica para mobile
  if (device === 'mobile') {
    optimizeForMobile();
  }
  
  // Monitorar mudanças de orientação
  window.addEventListener('orientationchange', handleOrientationChange);
  window.matchMedia("(orientation: portrait)").addEventListener('change', handleOrientationChange);
}

// Otimiza para dispositivos móveis
function optimizeForMobile() {
  // Ajustar tamanho de elementos para toque
  document.querySelectorAll('.nav-link, .btn, select, input[type="checkbox"], input[type="radio"]').forEach(el => {
    el.classList.add('touch-target');
  });
  
  // Adicionar suporte para gestos
  setupTouchGestures();
  
  // Otimizar formulários para mobile
  optimizeForms();
}

// Lidar com mudanças de orientação
function handleOrientationChange() {
  const orientation = detectOrientation();
  
  // Remover classes antigas
  document.documentElement.classList.remove('orientation-portrait', 'orientation-landscape');
  
  // Adicionar nova classe
  document.documentElement.classList.add(`orientation-${orientation}`);
  
  // Disparar evento customizado para que outros componentes possam reagir
  window.dispatchEvent(new CustomEvent('layoutchange', { 
    detail: { orientation }
  }));
}

// Configurar gestos de toque
function setupTouchGestures() {
  // Variáveis para rastreamento de toque
  let touchStartX = 0;
  let touchStartY = 0;
  let touchEndX = 0;
  let touchEndY = 0;
  
  // Configurar eventos de toque
  document.addEventListener('touchstart', function(event) {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  }, false);
  
  document.addEventListener('touchend', function(event) {
    touchEndX = event.changedTouches[0].screenX;
    touchEndY = event.changedTouches[0].screenY;
    handleGesture();
  }, false);
  
  // Interpretar o gesto
  function handleGesture() {
    const minDistance = 50; // Distância mínima para considerar um swipe
    
    // Calcular distâncias
    const distanceX = touchEndX - touchStartX;
    const distanceY = touchEndY - touchStartY;
    
    // Verificar se o movimento foi mais horizontal que vertical
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (Math.abs(distanceX) > minDistance) {
        // Disparar evento de swipe horizontal
        const direction = distanceX > 0 ? 'right' : 'left';
        document.dispatchEvent(new CustomEvent('swipe', { 
          detail: { direction, distance: Math.abs(distanceX) }
        }));
      }
    } else {
      if (Math.abs(distanceY) > minDistance) {
        // Disparar evento de swipe vertical
        const direction = distanceY > 0 ? 'down' : 'up';
        document.dispatchEvent(new CustomEvent('swipe', { 
          detail: { direction, distance: Math.abs(distanceY) }
        }));
      }
    }
  }
}

// Otimizar formulários para mobile
function optimizeForms() {
  // Ajustar tipo de teclado com base no campo
  document.querySelectorAll('input').forEach(input => {
    const type = input.getAttribute('type') || 'text';
    
    // Manter tipos específicos
    if (['email', 'tel', 'number', 'search', 'url'].includes(type)) {
      return;
    }
    
    // Verificar atributos para determinar o tipo mais apropriado
    if (input.id.includes('email') || input.name.includes('email')) {
      input.setAttribute('type', 'email');
      input.setAttribute('inputmode', 'email');
    } else if (input.id.includes('phone') || input.name.includes('phone') || 
              input.id.includes('tel') || input.name.includes('tel')) {
      input.setAttribute('type', 'tel');
      input.setAttribute('inputmode', 'tel');
    } else if (input.id.includes('number') || input.name.includes('number') || 
              input.classList.contains('numeric')) {
      input.setAttribute('inputmode', 'numeric');
    }
  });
  
  // Ajustar formulários para não fazer zoom em iOS
  const metaViewport = document.querySelector('meta[name="viewport"]');
  if (metaViewport) {
    const content = metaViewport.getAttribute('content') || '';
    if (!content.includes('maximum-scale')) {
      metaViewport.setAttribute('content', `${content}, maximum-scale=1, user-scalable=0`);
    }
  }
}

// Auto-ajuste para dispositivos de alta resolução (Retina)
export function setupHighDpiSupport() {
  if (window.devicePixelRatio > 1) {
    document.documentElement.classList.add('high-dpi');
    
    // Substituir imagens por versões de maior resolução
    document.querySelectorAll('img[data-high-res]').forEach(img => {
      const highResUrl = img.getAttribute('data-high-res');
      if (highResUrl) {
        img.setAttribute('src', highResUrl);
      }
    });
  }
}

// Inicialização
export function initMobileOptimizations() {
  setupResponsiveUI();
  setupHighDpiSupport();
  
  // Configurar estilos dinâmicos para garantir área de toque mínima
  const style = document.createElement('style');
  style.textContent = `
    .touch-target {
      min-height: 44px;
      min-width: 44px;
    }
    
    /* Ajustar espaçamento em telas menores */
    @media (max-width: 480px) {
      .container {
        padding-left: 12px;
        padding-right: 12px;
      }
      
      .row {
        margin-left: -8px;
        margin-right: -8px;
      }
      
      [class*="col-"] {
        padding-left: 8px;
        padding-right: 8px;
      }
    }
    
    /* Ocultar elementos não essenciais em telas muito pequenas */
    @media (max-width: 360px) {
      .hide-xs {
        display: none !important;
      }
    }
  `;
  
  document.head.appendChild(style);
  
  return {
    device: detectDevice(),
    orientation: detectOrientation(),
    highDpi: window.devicePixelRatio > 1
  };
}

export default {
  detectDevice,
  detectOrientation,
  setupResponsiveUI,
  setupHighDpiSupport,
  initMobileOptimizations
};