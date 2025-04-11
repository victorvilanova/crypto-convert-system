/**
 * Serviço para criação e gerenciamento de gráficos
 */
export class ChartService {
  /**
   * @param {Object} options - Opções de configuração
   * @param {string} options.chartLibrary - Biblioteca de gráficos a ser usada ('canvas', 'chartjs')
   */
  constructor(options = {}) {
    const { chartLibrary = 'canvas' } = options;

    this.chartLibrary = chartLibrary;
    this.charts = new Map();
    this.nextId = 1;
  }

  /**
   * Cria um gráfico de linha
   * @param {string|HTMLElement} container - Seletor CSS ou elemento do container do gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {number} - ID do gráfico criado
   */
  createLineChart(container, data, options = {}) {
    return this._createChart(container, 'line', data, options);
  }

  /**
   * Cria um gráfico de barras
   * @param {string|HTMLElement} container - Seletor CSS ou elemento do container do gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {number} - ID do gráfico criado
   */
  createBarChart(container, data, options = {}) {
    return this._createChart(container, 'bar', data, options);
  }

  /**
   * Cria um gráfico de pizza
   * @param {string|HTMLElement} container - Seletor CSS ou elemento do container do gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {number} - ID do gráfico criado
   */
  createPieChart(container, data, options = {}) {
    return this._createChart(container, 'pie', data, options);
  }

  /**
   * Cria um gráfico de área
   * @param {string|HTMLElement} container - Seletor CSS ou elemento do container do gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {number} - ID do gráfico criado
   */
  createAreaChart(container, data, options = {}) {
    return this._createChart(container, 'area', data, options);
  }

  /**
   * Cria um gráfico de preço de criptomoedas
   * @param {string|HTMLElement} container - Seletor CSS ou elemento do container do gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {number} - ID do gráfico criado
   */
  createCryptoPriceChart(container, data, options = {}) {
    const defaults = {
      title: 'Histórico de Preços',
      xAxisLabel: 'Data',
      yAxisLabel: 'Preço',
      colors: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'],
      showLegend: true,
      responsive: true,
      tooltips: true,
      animation: true,
      theme: document.documentElement.getAttribute('data-theme') || 'light',
    };

    const mergedOptions = { ...defaults, ...options };

    return this._createChart(container, 'line', data, mergedOptions);
  }

  /**
   * Cria um gráfico de comparação entre criptomoedas
   * @param {string|HTMLElement} container - Seletor CSS ou elemento do container do gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {number} - ID do gráfico criado
   */
  createCryptoComparisonChart(container, data, options = {}) {
    const defaults = {
      title: 'Comparação de Criptomoedas',
      xAxisLabel: 'Data',
      yAxisLabel: 'Valor Relativo (%)',
      colors: ['#3498db', '#2ecc71', '#e74c3c', '#f39c12', '#9b59b6'],
      showLegend: true,
      responsive: true,
      tooltips: true,
      animation: true,
      theme: document.documentElement.getAttribute('data-theme') || 'light',
      normalizeData: true, // Normalizar dados para comparação relativa
    };

    const mergedOptions = { ...defaults, ...options };

    // Normalizar dados se necessário
    let chartData = data;
    if (mergedOptions.normalizeData) {
      chartData = this._normalizeDataForComparison(data);
    }

    return this._createChart(container, 'line', chartData, mergedOptions);
  }

  /**
   * Atualiza os dados de um gráfico existente
   * @param {number} chartId - ID do gráfico a ser atualizado
   * @param {Object} newData - Novos dados para o gráfico
   * @param {Object} options - Opções de atualização
   * @returns {boolean} - Se a atualização foi bem-sucedida
   */
  updateChart(chartId, newData, options = {}) {
    const chart = this.charts.get(chartId);
    if (!chart) {
      console.error(`Gráfico não encontrado: ${chartId}`);
      return false;
    }

    try {
      // Implementação específica para cada biblioteca
      if (this.chartLibrary === 'chartjs' && chart.instance) {
        // Atualizar dados
        chart.instance.data = newData;

        // Atualizar opções se fornecidas
        if (options && Object.keys(options).length > 0) {
          Object.assign(chart.instance.options, options);
        }

        // Renderizar atualização
        chart.instance.update();
        return true;
      } else {
        // Implementação para Canvas
        this._destroyChart(chartId);
        this._createChart(chart.container, chart.type, newData, {
          ...chart.options,
          ...options,
        });
        return true;
      }
    } catch (error) {
      console.error('Erro ao atualizar gráfico:', error);
      return false;
    }
  }

  /**
   * Destrói um gráfico existente
   * @param {number} chartId - ID do gráfico a ser destruído
   * @returns {boolean} - Se a destruição foi bem-sucedida
   */
  destroyChart(chartId) {
    return this._destroyChart(chartId);
  }

  /**
   * Destrói todos os gráficos
   */
  destroyAllCharts() {
    for (const [chartId] of this.charts) {
      this._destroyChart(chartId);
    }
  }

  /**
   * Cria um gráfico genérico
   * @param {string|HTMLElement} container - Seletor CSS ou elemento do container do gráfico
   * @param {string} type - Tipo de gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {number} - ID do gráfico criado
   * @private
   */
  _createChart(container, type, data, options) {
    try {
      // Obter o elemento container
      const containerElement =
        typeof container === 'string'
          ? document.querySelector(container)
          : container;

      if (!containerElement) {
        throw new Error(`Container não encontrado: ${container}`);
      }

      // Criar ID para o gráfico
      const chartId = this.nextId++;

      // Implementação específica para cada biblioteca
      let chartInstance = null;

      if (this.chartLibrary === 'chartjs') {
        chartInstance = this._createChartJS(
          containerElement,
          type,
          data,
          options
        );
      } else {
        // Fallback para implementação canvas
        chartInstance = this._createCanvasChart(
          containerElement,
          type,
          data,
          options
        );
      }

      // Armazenar referência ao gráfico
      this.charts.set(chartId, {
        id: chartId,
        type,
        container: containerElement,
        instance: chartInstance,
        options,
      });

      return chartId;
    } catch (error) {
      console.error('Erro ao criar gráfico:', error);
      return null;
    }
  }

  /**
   * Cria um gráfico usando Chart.js
   * @param {HTMLElement} container - Elemento do container do gráfico
   * @param {string} type - Tipo de gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {Object} - Instância do gráfico
   * @private
   */
  _createChartJS(container, type, data, options) {
    // Verificar se Chart.js está disponível
    if (typeof Chart === 'undefined') {
      console.error(
        'Chart.js não está disponível. Incluir a biblioteca ou usar outro modo.'
      );
      return null;
    }

    // Criar elemento canvas
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);

    // Mapear tipo interno para tipo do Chart.js
    const chartjsType = this._mapChartType(type);

    // Construir configuração para Chart.js
    const chartConfig = {
      type: chartjsType,
      data: this._formatDataForChartJS(data, type),
      options: this._formatOptionsForChartJS(options, type),
    };

    // Criar e retornar instância do Chart.js
    return new Chart(canvas, chartConfig);
  }

  /**
   * Cria um gráfico usando canvas puro
   * @param {HTMLElement} container - Elemento do container do gráfico
   * @param {string} type - Tipo de gráfico
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @returns {Object} - Informações do gráfico
   * @private
   */
  _createCanvasChart(container, type, data, options) {
    // Implementação básica de gráfico usando canvas

    // Limpar container
    container.innerHTML = '';

    // Criar elemento canvas
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 400;
    canvas.height = container.clientHeight || 300;
    container.appendChild(canvas);

    // Obter contexto 2D
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Não foi possível obter contexto do canvas');
    }

    // Verificar se temos dados válidos
    if (!data || !data.labels || !data.datasets || data.datasets.length === 0) {
      this._drawNoDataMessage(ctx, canvas.width, canvas.height, options);
      return { canvas, ctx };
    }

    // Renderizar gráfico conforme o tipo
    switch (type) {
      case 'line':
        this._drawLineChart(ctx, canvas.width, canvas.height, data, options);
        break;
      case 'bar':
        this._drawBarChart(ctx, canvas.width, canvas.height, data, options);
        break;
      case 'pie':
        this._drawPieChart(ctx, canvas.width, canvas.height, data, options);
        break;
      case 'area':
        this._drawAreaChart(ctx, canvas.width, canvas.height, data, options);
        break;
      default:
        console.warn(
          `Tipo de gráfico não suportado: ${type}. Usando 'line' como fallback.`
        );
        this._drawLineChart(ctx, canvas.width, canvas.height, data, options);
    }

    // Adicionar título se especificado
    if (options.title) {
      this._drawTitle(ctx, canvas.width, canvas.height, options.title);
    }

    // Adicionar legenda se especificado
    if (options.showLegend) {
      this._drawLegend(
        ctx,
        canvas.width,
        canvas.height,
        data.datasets,
        options
      );
    }

    // Retornar informações do gráfico
    return { canvas, ctx };
  }

  /**
   * Desenha um gráfico de linha básico
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura do canvas
   * @param {number} height - Altura do canvas
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @private
   */
  _drawLineChart(ctx, width, height, data, options) {
    // Implementação básica de um gráfico de linha
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Escala X e Y
    const xStep = chartWidth / (data.labels.length - 1);

    // Encontrar valores min/max para escala Y
    let minValue = Infinity;
    let maxValue = -Infinity;

    data.datasets.forEach((dataset) => {
      dataset.data.forEach((value) => {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      });
    });

    // Ajustar escala para ter margem
    const range = maxValue - minValue;
    minValue = Math.max(0, minValue - range * 0.1);
    maxValue = maxValue + range * 0.1;

    // Desenhar eixos
    ctx.strokeStyle = this._getThemeColor(options.theme, 'text');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    // Desenhar linhas de grade
    this._drawGrid(
      ctx,
      padding,
      width - padding,
      height - padding,
      5,
      5,
      options
    );

    // Desenhar rótulos do eixo X
    ctx.fillStyle = this._getThemeColor(options.theme, 'text');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    data.labels.forEach((label, i) => {
      const x = padding + i * xStep;
      ctx.fillText(label, x, height - padding + 10);
    });

    // Desenhar datasets
    data.datasets.forEach((dataset, datasetIndex) => {
      const color =
        dataset.borderColor ||
        options.colors[datasetIndex % options.colors.length];

      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      dataset.data.forEach((value, i) => {
        const x = padding + i * xStep;
        const y =
          height -
          padding -
          ((value - minValue) / (maxValue - minValue)) * chartHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();

      // Desenhar pontos
      ctx.fillStyle = color;

      dataset.data.forEach((value, i) => {
        const x = padding + i * xStep;
        const y =
          height -
          padding -
          ((value - minValue) / (maxValue - minValue)) * chartHeight;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  /**
   * Desenha um gráfico de barras básico
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura do canvas
   * @param {number} height - Altura do canvas
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @private
   */
  _drawBarChart(ctx, width, height, data, options) {
    // Implementação básica de um gráfico de barras
    // [implementação omitida para brevidade]
  }

  /**
   * Desenha um gráfico de pizza básico
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura do canvas
   * @param {number} height - Altura do canvas
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @private
   */
  _drawPieChart(ctx, width, height, data, options) {
    // Implementação básica de um gráfico de pizza
    // [implementação omitida para brevidade]
  }

  /**
   * Desenha um gráfico de área básico
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura do canvas
   * @param {number} height - Altura do canvas
   * @param {Object} data - Dados para o gráfico
   * @param {Object} options - Opções de configuração
   * @private
   */
  _drawAreaChart(ctx, width, height, data, options) {
    // Implementação básica de um gráfico de área
    // [implementação omitida para brevidade]
  }

  /**
   * Desenha uma mensagem quando não há dados
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura do canvas
   * @param {number} height - Altura do canvas
   * @param {Object} options - Opções de configuração
   * @private
   */
  _drawNoDataMessage(ctx, width, height, options) {
    ctx.fillStyle = this._getThemeColor(options.theme, 'text');
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '16px Arial';
    ctx.fillText('Nenhum dado disponível para exibição', width / 2, height / 2);
  }

  /**
   * Desenha o título do gráfico
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura do canvas
   * @param {number} height - Altura do canvas
   * @param {string} title - Título do gráfico
   * @private
   */
  _drawTitle(ctx, width, height, title) {
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = 'bold 16px Arial';
    ctx.fillText(title, width / 2, 10);
  }

  /**
   * Desenha a legenda do gráfico
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} width - Largura do canvas
   * @param {number} height - Altura do canvas
   * @param {Array} datasets - Conjuntos de dados
   * @param {Object} options - Opções de configuração
   * @private
   */
  _drawLegend(ctx, width, height, datasets, options) {
    // [implementação omitida para brevidade]
  }

  /**
   * Desenha linhas de grade
   * @param {CanvasRenderingContext2D} ctx - Contexto do canvas
   * @param {number} left - Coordenada esquerda
   * @param {number} right - Coordenada direita
   * @param {number} bottom - Coordenada inferior
   * @param {number} hLines - Número de linhas horizontais
   * @param {number} vLines - Número de linhas verticais
   * @param {Object} options - Opções de configuração
   * @private
   */
  _drawGrid(ctx, left, right, bottom, hLines, vLines, options) {
    const top = 40;
    const width = right - left;
    const height = bottom - top;

    ctx.strokeStyle = this._getThemeColor(
      options.theme,
      'grid',
      'rgba(0,0,0,0.1)'
    );
    ctx.lineWidth = 0.5;

    // Linhas horizontais
    for (let i = 0; i <= hLines; i++) {
      const y = top + (height / hLines) * i;
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(right, y);
      ctx.stroke();
    }

    // Linhas verticais
    for (let i = 0; i <= vLines; i++) {
      const x = left + (width / vLines) * i;
      ctx.beginPath();
      ctx.moveTo(x, top);
      ctx.lineTo(x, bottom);
      ctx.stroke();
    }
  }

  /**
   * Obtém a cor para um tema específico
   * @param {string} theme - Tema (light, dark)
   * @param {string} element - Elemento a ser colorido
   * @param {string} defaultColor - Cor padrão
   * @returns {string} - Cor para o tema
   * @private
   */
  _getThemeColor(theme, element, defaultColor = '#333') {
    const colors = {
      light: {
        text: '#333',
        background: '#fff',
        grid: 'rgba(0,0,0,0.1)',
        line: '#3498db',
      },
      dark: {
        text: '#eee',
        background: '#222',
        grid: 'rgba(255,255,255,0.1)',
        line: '#3498db',
      },
    };

    return colors[theme]?.[element] || defaultColor;
  }

  /**
   * Mapeia tipos internos para tipos do Chart.js
   * @param {string} internalType - Tipo interno
   * @returns {string} - Tipo do Chart.js
   * @private
   */
  _mapChartType(internalType) {
    const mapping = {
      line: 'line',
      bar: 'bar',
      pie: 'pie',
      area: 'line', // Área é um tipo de linha no Chart.js
    };

    return mapping[internalType] || 'line';
  }

  /**
   * Formata dados para uso com Chart.js
   * @param {Object} data - Dados no formato interno
   * @param {string} type - Tipo de gráfico
   * @returns {Object} - Dados formatados para Chart.js
   * @private
   */
  _formatDataForChartJS(data, type) {
    // Para tipo area, modificar datasets para incluir fill: true
    if (type === 'area' && data.datasets) {
      return {
        labels: data.labels,
        datasets: data.datasets.map((dataset) => ({
          ...dataset,
          fill: true,
        })),
      };
    }

    return data;
  }

  /**
   * Formata opções para uso com Chart.js
   * @param {Object} options - Opções no formato interno
   * @param {string} type - Tipo de gráfico
   * @returns {Object} - Opções formatadas para Chart.js
   * @private
   */
  _formatOptionsForChartJS(options, type) {
    // Mapear opções internas para opções do Chart.js
    return {
      responsive: options.responsive !== false,
      maintainAspectRatio: false,
      animation: options.animation !== false ? { duration: 1000 } : false,
      plugins: {
        legend: {
          display: options.showLegend !== false,
          position: 'top',
        },
        title: {
          display: !!options.title,
          text: options.title || '',
        },
        tooltip: {
          enabled: options.tooltips !== false,
        },
      },
      scales:
        type !== 'pie'
          ? {
              x: {
                display: true,
                title: {
                  display: !!options.xAxisLabel,
                  text: options.xAxisLabel || '',
                },
              },
              y: {
                display: true,
                title: {
                  display: !!options.yAxisLabel,
                  text: options.yAxisLabel || '',
                },
                beginAtZero: options.beginAtZero !== false,
              },
            }
          : undefined,
    };
  }

  /**
   * Normaliza dados para comparação relativa entre diferentes moedas
   * @param {Object} data - Dados originais
   * @returns {Object} - Dados normalizados
   * @private
   */
  _normalizeDataForComparison(data) {
    if (!data || !data.datasets || data.datasets.length === 0) {
      return data;
    }

    // Clonar dados para não modificar o original
    const normalizedData = {
      labels: [...data.labels],
      datasets: [],
    };

    // Para cada dataset, normalizar para o valor inicial (100%)
    data.datasets.forEach((dataset) => {
      if (!dataset.data || dataset.data.length === 0) {
        normalizedData.datasets.push({ ...dataset, data: [] });
        return;
      }

      const initialValue = dataset.data[0];
      if (initialValue === 0) {
        // Não podemos dividir por zero, usar valores originais
        normalizedData.datasets.push({ ...dataset, data: [...dataset.data] });
        return;
      }

      // Calcular valores relativos ao inicial
      const normalizedValues = dataset.data.map(
        (value) => (value / initialValue) * 100
      );

      normalizedData.datasets.push({
        ...dataset,
        data: normalizedValues,
        label: `${dataset.label || 'Série'} (relativo %)`,
      });
    });

    return normalizedData;
  }

  /**
   * Destrói um gráfico específico
   * @param {number} chartId - ID do gráfico
   * @returns {boolean} - Se a destruição foi bem-sucedida
   * @private
   */
  _destroyChart(chartId) {
    const chart = this.charts.get(chartId);
    if (!chart) return false;

    try {
      // Implementação específica para cada biblioteca
      if (this.chartLibrary === 'chartjs' && chart.instance) {
        chart.instance.destroy();
      } else if (chart.instance && chart.instance.canvas) {
        // Limpar canvas
        chart.instance.ctx.clearRect(
          0,
          0,
          chart.instance.canvas.width,
          chart.instance.canvas.height
        );

        // Remover canvas
        if (chart.instance.canvas.parentNode) {
          chart.instance.canvas.parentNode.removeChild(chart.instance.canvas);
        }
      }

      // Remover do mapa de gráficos
      this.charts.delete(chartId);

      return true;
    } catch (error) {
      console.error('Erro ao destruir gráfico:', error);
      return false;
    }
  }
}
