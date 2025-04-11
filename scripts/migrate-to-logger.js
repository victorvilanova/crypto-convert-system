/**
 * Script para migrar arquivos JavaScript para o sistema de logging.
 * 
 * Este script pode ser executado com:
 * node scripts/migrate-to-logger.js <diretório>
 * 
 * Exemplos:
 * node scripts/migrate-to-logger.js src/services
 * node scripts/migrate-to-logger.js src/utils
 */

const fs = require('fs');
const path = require('path');

// Diretório alvo para a migração (padrão: src)
const targetDir = process.argv[2] || 'src';

// Expressão regular para detectar console.log
const consoleLogRegex = /console\.(log|warn|error|info|debug)\((.*?)\);/g;

// Contador de arquivos e substituições
let filesProcessed = 0;
let filesModified = 0;
let replacementsCount = 0;

/**
 * Processa um arquivo JavaScript
 * @param {string} filePath - Caminho do arquivo
 */
function processFile(filePath) {
  // Ignora arquivos não JavaScript
  if (!filePath.endsWith('.js')) return;
  
  filesProcessed++;
  
  // Ler o conteúdo do arquivo
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Verificar se o arquivo já importa o Logger
  const hasLoggerImport = content.includes('import { getLogger }') || 
                          content.includes('import {getLogger}');
  
  // Verificar se há console.log no arquivo
  const hasConsoleLogs = consoleLogRegex.test(content);
  consoleLogRegex.lastIndex = 0; // Reset da regex para próximas buscas
  
  if (!hasConsoleLogs) return;
  
  let modifiedContent = content;
  
  // Adicionar import de Logger se necessário
  if (!hasLoggerImport) {
    // Extrair o nome do módulo do caminho do arquivo
    const moduleName = path.basename(filePath, '.js');
    
    // Inserir o import e a declaração do logger no início do arquivo
    // Após outras importações ou comentários iniciais
    const importStatement = `import { getLogger } from '../utils/Logger';\n\n// Criar uma instância de logger específica para ${moduleName}\nconst logger = getLogger('${moduleName}');\n\n`;
    
    // Encontrar o melhor local para inserir (após importações ou no início)
    const importEndIndex = findImportSectionEnd(modifiedContent);
    if (importEndIndex > 0) {
      modifiedContent = modifiedContent.substring(0, importEndIndex) + '\n' + 
                        importStatement + modifiedContent.substring(importEndIndex);
    } else {
      modifiedContent = importStatement + modifiedContent;
    }
  }
  
  // Substituir console.log por logger
  modifiedContent = modifiedContent.replace(consoleLogRegex, (match, level, args) => {
    replacementsCount++;
    
    // Mapear níveis do console para níveis do logger
    const logLevel = mapConsoleToLoggerLevel(level);
    
    return `logger.${logLevel}(${args});`;
  });
  
  // Verificar se houve mudanças
  if (modifiedContent !== content) {
    fs.writeFileSync(filePath, modifiedContent, 'utf8');
    filesModified++;
    console.log(`✓ Arquivo atualizado: ${filePath}`);
  }
}

/**
 * Encontra o final da seção de importações em um arquivo JS
 * @param {string} content - Conteúdo do arquivo
 * @returns {number} - Posição do final das importações
 */
function findImportSectionEnd(content) {
  const lines = content.split('\n');
  let lastImportLine = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('import ') || line.startsWith('// import') || line.startsWith('/* import')) {
      lastImportLine = i + 1;
    } else if (lastImportLine > 0 && line !== '' && !line.startsWith('//') && !line.startsWith('/*')) {
      return lines.slice(0, lastImportLine).join('\n').length;
    }
  }
  
  return 0;
}

/**
 * Mapeia níveis do console para níveis do logger
 * @param {string} consoleLevel - Nível do console (log, warn, error)
 * @returns {string} - Nível correspondente no logger
 */
function mapConsoleToLoggerLevel(consoleLevel) {
  switch (consoleLevel) {
    case 'warn': return 'warn';
    case 'error': return 'error';
    case 'info': return 'info';
    case 'debug': return 'debug';
    case 'log':
    default: return 'info';
  }
}

/**
 * Processa um diretório recursivamente
 * @param {string} dirPath - Caminho do diretório
 */
function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    const entryPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(entryPath);
    } else if (entry.isFile()) {
      processFile(entryPath);
    }
  }
}

// Iniciar processamento
console.log(`Iniciando migração de console.log para logger em: ${targetDir}`);
console.log('-----------------------------------------------------');

try {
  processDirectory(targetDir);
  
  console.log('-----------------------------------------------------');
  console.log(`Processamento concluído!`);
  console.log(`Arquivos processados: ${filesProcessed}`);
  console.log(`Arquivos modificados: ${filesModified}`);
  console.log(`Total de substituições: ${replacementsCount}`);
} catch (error) {
  console.error('Erro durante o processamento:', error);
} 