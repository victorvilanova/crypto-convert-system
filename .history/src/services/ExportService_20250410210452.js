/**
 * Serviço para exportação de dados
 */
export class ExportService {
  /**
   * Exporta dados para um arquivo no formato especificado
   * @param {Object[]} data - Dados a serem exportados
   * @param {string} format - Formato de exportação (csv, json, etc)
   * @param {string} filename - Nome do arquivo a ser gerado
   * @param {Object} options - Opções de exportação
   * @returns {boolean} - Se a exportação foi bem-sucedida
   */
  export(data, format = 'csv', filename = 'export', options = {}) {
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.error('Dados inválidos para exportação');
      return false;
    }

    // Normalizar formato
    format = format.toLowerCase();

    // Verificar se o formato é suportado
    if (!this._isSupportedFormat(format)) {
      console.error(`Formato não suportado: ${format}`);
      return false;
    }

    // Garantir extensão de arquivo correta
    if (!filename.endsWith(`.${format}`)) {
      filename = `${filename}.${format}`;
    }

    try {
      // Chamar o método específico para o formato
      const exportMethod = this[`_exportTo${format.toUpperCase()}`];
      if (typeof exportMethod === 'function') {
        return exportMethod.call(this, data, filename, options);
      }

      throw new Error(`Método de exportação não implementado para ${format}`);
    } catch (error) {
      console.error(`Erro ao exportar para ${format}:`, error);
      return false;
    }
  }

  /**
   * Verifica se um formato é suportado
   * @param {string} format - Formato a verificar
   * @returns {boolean} - Se o formato é suportado
   * @private
   */
  _isSupportedFormat(format) {
    return ['csv', 'json', 'txt', 'html'].includes(format);
  }

  /**
   * Exporta dados para CSV
   * @param {Object[]} data - Dados a serem exportados
   * @param {string} filename - Nome do arquivo
   * @param {Object} options - Opções de exportação
   * @returns {boolean} - Se a exportação foi bem-sucedida
   * @private
   */
  _exportToCSV(data, filename, options = {}) {
    const {
      delimiter = ',',
      includeHeader = true,
      columns = null,
      dateFormat = 'YYYY-MM-DD',
    } = options;

    // Determinar colunas a serem exportadas
    const columnDefs = this._getColumnDefinitions(data, columns);

    // Criar conteúdo CSV
    let csvContent = '';

    // Adicionar cabeçalho
    if (includeHeader) {
      csvContent +=
        columnDefs
          .map((col) => this._escapeCSV(col.header || col.key))
          .join(delimiter) + '\n';
    }

    // Adicionar linhas de dados
    for (const item of data) {
      const row = columnDefs
        .map((col) => {
          const value = item[col.key];

          // Formatar valor de acordo com o tipo
          let formattedValue = '';

          if (value === null || value === undefined) {
            formattedValue = '';
          } else if (value instanceof Date) {
            formattedValue = this._formatDate(value, dateFormat);
          } else if (typeof value === 'object') {
            formattedValue = JSON.stringify(value);
          } else {
            formattedValue = String(value);
          }

          // Aplicar qualquer formatação personalizada
          if (col.formatter && typeof col.formatter === 'function') {
            formattedValue = col.formatter(value, item);
          }

          return this._escapeCSV(formattedValue);
        })
        .join(delimiter);

      csvContent += row + '\n';
    }

    return this._downloadFile(csvContent, filename, 'text/csv');
  }

  /**
   * Exporta dados para JSON
   * @param {Object[]} data - Dados a serem exportados
   * @param {string} filename - Nome do arquivo
   * @param {Object} options - Opções de exportação
   * @returns {boolean} - Se a exportação foi bem-sucedida
   * @private
   */
  _exportToJSON(data, filename, options = {}) {
    const { pretty = true, columns = null, transform = null } = options;

    // Filtrar colunas se especificado
    let exportData = data;
    if (columns && Array.isArray(columns)) {
      exportData = data.map((item) => {
        const filteredItem = {};
        columns.forEach((col) => {
          const key = typeof col === 'object' ? col.key : col;
          if (item.hasOwnProperty(key)) {
            filteredItem[key] = item[key];
          }
        });
        return filteredItem;
      });
    }

    // Aplicar transformação personalizada se fornecida
    if (transform && typeof transform === 'function') {
      exportData = transform(exportData);
    }

    // Converter para string JSON
    const jsonContent = pretty
      ? JSON.stringify(exportData, null, 2)
      : JSON.stringify(exportData);

    return this._downloadFile(jsonContent, filename, 'application/json');
  }

  /**
   * Exporta dados para TXT (texto simples)
   * @param {Object[]} data - Dados a serem exportados
   * @param {string} filename - Nome do arquivo
   * @param {Object} options - Opções de exportação
   * @returns {boolean} - Se a exportação foi bem-sucedida
   * @private
   */
  _exportToTXT(data, filename, options = {}) {
    const {
      delimiter = '\t',
      includeHeader = true,
      columns = null,
      rowSeparator = '\n',
      dateFormat = 'YYYY-MM-DD',
    } = options;

    // Determinar colunas a serem exportadas
    const columnDefs = this._getColumnDefinitions(data, columns);

    // Criar conteúdo de texto
    let textContent = '';

    // Adicionar cabeçalho
    if (includeHeader) {
      textContent +=
        columnDefs.map((col) => col.header || col.key).join(delimiter) +
        rowSeparator;
    }

    // Adicionar linhas de dados
    for (const item of data) {
      const row = columnDefs
        .map((col) => {
          const value = item[col.key];

          // Formatar valor de acordo com o tipo
          if (value === null || value === undefined) {
            return '';
          } else if (value instanceof Date) {
            return this._formatDate(value, dateFormat);
          } else if (typeof value === 'object') {
            return JSON.stringify(value);
          } else {
            return String(value);
          }
        })
        .join(delimiter);

      textContent += row + rowSeparator;
    }

    return this._downloadFile(textContent, filename, 'text/plain');
  }

  /**
   * Exporta dados para HTML
   * @param {Object[]} data - Dados a serem exportados
   * @param {string} filename - Nome do arquivo
   * @param {Object} options - Opções de exportação
   * @returns {boolean} - Se a exportação foi bem-sucedida
   * @private
   */
  _exportToHTML(data, filename, options = {}) {
    const {
      title = 'Dados Exportados',
      columns = null,
      includeStyles = true,
      dateFormat = 'YYYY-MM-DD',
    } = options;

    // Determinar colunas a serem exportadas
    const columnDefs = this._getColumnDefinitions(data, columns);

    // Criar conteúdo HTML
    let htmlContent = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <title>${title}</title>
        ${includeStyles ? this._getHTMLStyles() : ''}
      </head>
      <body>
        <div class="container">
          <h1>${title}</h1>
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  ${columnDefs
                    .map((col) => `<th>${col.header || col.key}</th>`)
                    .join('')}
                </tr>
              </thead>
              <tbody>
    `;

    // Adicionar linhas de dados
    for (const item of data) {
      htmlContent += '<tr>';

      for (const col of columnDefs) {
        const value = item[col.key];
        let cellContent = '';

        // Formatar valor de acordo com o tipo
        if (value === null || value === undefined) {
          cellContent = '';
        } else if (value instanceof Date) {
          cellContent = this._formatDate(value, dateFormat);
        } else if (typeof value === 'object') {
          cellContent = JSON.stringify(value);
        } else {
          cellContent = String(value);
        }

        // Aplicar formatador personalizado se disponível
        if (col.formatter && typeof col.formatter === 'function') {
          cellContent = col.formatter(value, item);
        }

        htmlContent += `<td>${cellContent}</td>`;
      }

      htmlContent += '</tr>';
    }

    // Fechar tabela e documento
    htmlContent += `
              </tbody>
            </table>
          </div>
          <div class="footer">
            <p>Gerado em: ${this._formatDate(
              new Date(),
              'DD/MM/YYYY HH:mm:ss'
            )}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return this._downloadFile(htmlContent, filename, 'text/html');
  }

  /**
   * Obtém definições de colunas para exportação
   * @param {Object[]} data - Dados a serem exportados
   * @param {Array|null} columns - Configuração de colunas
   * @returns {Object[]} - Definições de colunas normalizadas
   * @private
   */
  _getColumnDefinitions(data, columns) {
    // Se colunas não foram especificadas, extrair das chaves do primeiro item
    if (!columns || !Array.isArray(columns) || columns.length === 0) {
      if (data.length === 0) return [];

      const firstItem = data[0];
      return Object.keys(firstItem).map((key) => ({ key, header: key }));
    }

    // Normalizar definições de colunas
    return columns.map((col) => {
      if (typeof col === 'string') {
        return { key: col, header: col };
      } else if (typeof col === 'object' && col.key) {
        return { ...col };
      }

      throw new Error('Definição de coluna inválida');
    });
  }

  /**
   * Formata uma data de acordo com o formato especificado
   * @param {Date} date - Data a ser formatada
   * @param {string} format - Formato desejado
   * @returns {string} - Data formatada
   * @private
   */
  _formatDate(date, format) {
    if (!date || !(date instanceof Date)) return '';

    // Formato simples YYYY-MM-DD
    if (format === 'YYYY-MM-DD') {
      return date.toISOString().split('T')[0];
    }

    // Formato DD/MM/YYYY
    if (format === 'DD/MM/YYYY') {
      return `${String(date.getDate()).padStart(2, '0')}/${String(
        date.getMonth() + 1
      ).padStart(2, '0')}/${date.getFullYear()}`;
    }

    // Formato com hora
    if (format === 'DD/MM/YYYY HH:mm:ss') {
      return `${String(date.getDate()).padStart(2, '0')}/${String(
        date.getMonth() + 1
      ).padStart(2, '0')}/${date.getFullYear()} ${String(
        date.getHours()
      ).padStart(2, '0')}:${String(date.getMinutes()).padStart(
        2,
        '0'
      )}:${String(date.getSeconds()).padStart(2, '0')}`;
    }

    // Formato ISO
    if (format === 'ISO') {
      return date.toISOString();
    }

    // Formato padrão
    return date.toString();
  }

  /**
   * Escapa um valor para uso em CSV
   * @param {string} value - Valor a ser escapado
   * @returns {string} - Valor escapado
   * @private
   */
  _escapeCSV(value) {
    if (value === null || value === undefined) return '';

    const stringValue = String(value);

    // Se contém vírgula, aspas duplas ou quebra de linha, envolver em aspas
    if (/[",\n\r]/.test(stringValue)) {
      // Escapar aspas duplicando-as
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * Inicia o download de um arquivo
   * @param {string} content - Conteúdo do arquivo
   * @param {string} filename - Nome do arquivo
   * @param {string} mimeType - Tipo MIME do arquivo
   * @returns {boolean} - Se o download foi iniciado com sucesso
   * @private
   */
  _downloadFile(content, filename, mimeType) {
    try {
      // Criar blob com o conteúdo
      const blob = new Blob([content], { type: mimeType });

      // Criar URL para o blob
      const url = URL.createObjectURL(blob);

      // Criar elemento de link
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      // Adicionar à página
      document.body.appendChild(link);

      // Clicar no link para iniciar o download
      link.click();

      // Limpar
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      return true;
    } catch (error) {
      console.error('Erro ao fazer download do arquivo:', error);
      return false;
    }
  }

  /**
   * Retorna estilos CSS para exportação HTML
   * @returns {string} - Tag de estilo com CSS
   * @private
   */
  _getHTMLStyles() {
    return `
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 20px;
          color: #333;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
        }
        h1 {
          color: #2c3e50;
          margin-bottom: 20px;
        }
        .table-responsive {
          overflow-x: auto;
        }
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        .data-table th {
          background-color: #3498db;
          color: white;
          font-weight: bold;
          padding: 10px;
          text-align: left;
          border: 1px solid #ddd;
        }
        .data-table td {
          padding: 8px;
          border: 1px solid #ddd;
        }
        .data-table tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        .data-table tr:hover {
          background-color: #e9f7fe;
        }
        .footer {
          margin-top: 20px;
          color: #7f8c8d;
          font-size: 12px;
        }
      </style>
    `;
  }
}
