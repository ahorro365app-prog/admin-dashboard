#!/usr/bin/env ts-node

/**
 * Script para detectar código huérfano (no usado) en el proyecto
 * 
 * Uso:
 *   npm run lint:orphans
 *   o
 *   npx ts-node scripts/detect-orphaned-code.ts
 * 
 * Detecta:
 * - Archivos que no se importan en ningún lugar
 * - Funciones exportadas que no se usan
 * - Imports no utilizados (básico)
 */

import * as fs from 'fs';
import * as path from 'path';

// Usar fs para buscar archivos (más simple, sin dependencias adicionales)
async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];
  
  function walkDir(currentPath: string) {
    const entries = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      // Ignorar node_modules, .next, etc.
      if (entry.name.startsWith('.') || 
          entry.name === 'node_modules' || 
          entry.name === '.next' ||
          entry.name === 'dist' ||
          entry.name === 'build') {
        continue;
      }
      
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  walkDir(dir);
  return files;
}

interface OrphanedFile {
  path: string;
  reason: string;
}

interface OrphanedExport {
  file: string;
  exportName: string;
  line?: number;
}

// Archivos que deben ser ignorados (pueden no tener imports directos)
const IGNORED_PATTERNS = [
  '**/node_modules/**',
  '**/.next/**',
  '**/dist/**',
  '**/build/**',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/scripts/**', // Scripts pueden no tener imports
  '**/middleware.ts', // Middleware se usa automáticamente
  '**/layout.tsx', // Layouts se usan automáticamente
  '**/page.tsx', // Pages se usan automáticamente
  '**/route.ts', // API routes se usan automáticamente
  '**/error.tsx',
  '**/loading.tsx',
  '**/not-found.tsx',
];

// Archivos conocidos que pueden no tener imports pero son necesarios
const KNOWN_VALID_FILES = [
  'src/lib/debug.ts', // Este archivo SÍ es huérfano y debe eliminarse
];

async function findSourceFiles(): Promise<string[]> {
  const srcDir = path.join(process.cwd(), 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ Directorio src/ no encontrado');
    return [];
  }
  
  const allFiles = await findFiles(srcDir, ['.ts', '.tsx']);
  
  // Filtrar archivos que deben ser ignorados
  return allFiles.filter(file => {
    const relativePath = path.relative(process.cwd(), file);
    
    // Ignorar archivos especiales de Next.js (se usan automáticamente)
    const fileName = path.basename(file);
    if (['middleware.ts', 'layout.tsx', 'page.tsx', 'route.ts', 'error.tsx', 'loading.tsx', 'not-found.tsx'].includes(fileName)) {
      return false;
    }
    
    // Ignorar archivos de test
    if (file.includes('.test.') || file.includes('.spec.')) {
      return false;
    }
    
    return true;
  });
}

function extractExports(filePath: string): string[] {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const exports: string[] = [];
    
    // Buscar exports nombrados: export function, export const, export class, etc.
    const namedExportRegex = /export\s+(?:async\s+)?(?:function|const|class|interface|type|enum)\s+(\w+)/g;
    let match;
    while ((match = namedExportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    // Buscar export default
    if (/export\s+default/.test(content)) {
      exports.push('default');
    }
    
    return exports;
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error);
    return [];
  }
}

function findImportsOfFile(targetFile: string, allFiles: string[]): string[] {
  const imports: string[] = [];
  const targetPath = path.relative(process.cwd(), targetFile);
  const targetWithoutExt = targetPath.replace(/\.(ts|tsx)$/, '');
  
  for (const file of allFiles) {
    if (file === targetFile) continue;
    
    try {
      const content = fs.readFileSync(file, 'utf-8');
      
      // Buscar imports del archivo
      const importPatterns = [
        new RegExp(`from\\s+['"]@/${targetWithoutExt}['"]`, 'g'),
        new RegExp(`from\\s+['"]\\./${path.basename(targetWithoutExt)}['"]`, 'g'),
        new RegExp(`from\\s+['"]\\.\\./.*${path.basename(targetWithoutExt)}['"]`, 'g'),
        new RegExp(`require\\(['"]@/${targetWithoutExt}['"]\\)`, 'g'),
        new RegExp(`require\\(['"]\\./${path.basename(targetWithoutExt)}['"]\\)`, 'g'),
      ];
      
      for (const pattern of importPatterns) {
        if (pattern.test(content)) {
          imports.push(file);
          break;
        }
      }
    } catch (error) {
      // Ignorar errores de lectura
    }
  }
  
  return imports;
}

async function detectOrphanedCode(): Promise<{
  orphanedFiles: OrphanedFile[];
  orphanedExports: OrphanedExport[];
}> {
  console.log('🔍 Buscando código huérfano...\n');
  
  const allFiles = await findSourceFiles();
  const orphanedFiles: OrphanedFile[] = [];
  const orphanedExports: OrphanedExport[] = [];
  
  // Verificar archivos que no se importan
  for (const file of allFiles) {
    const relativePath = path.relative(process.cwd(), file);
    
    // Saltar archivos conocidos como válidos (excepto debug.ts que SÍ es huérfano)
    if (KNOWN_VALID_FILES.includes(relativePath) && relativePath === 'src/lib/debug.ts') {
      orphanedFiles.push({
        path: relativePath,
        reason: 'Archivo no usado - contiene funciones de test no importadas',
      });
      continue;
    }
    
    // Verificar si el archivo se importa en algún lugar
    const imports = findImportsOfFile(file, allFiles);
    
    if (imports.length === 0) {
      // Verificar si es un archivo especial de Next.js (se usan automáticamente)
      const fileName = path.basename(file);
      const isSpecialFile = ['middleware.ts', 'layout.tsx', 'page.tsx', 'route.ts', 'error.tsx', 'loading.tsx', 'not-found.tsx'].includes(fileName);
      
      if (!isSpecialFile && !relativePath.includes('scripts/')) {
        orphanedFiles.push({
          path: relativePath,
          reason: 'No se encontraron imports de este archivo',
        });
      }
    }
  }
  
  // Verificar exports no usados (análisis básico)
  for (const file of allFiles) {
    const exports = extractExports(file);
    const relativePath = path.relative(process.cwd(), file);
    
    // Solo verificar archivos en lib/ (más propensos a tener exports no usados)
    if (!relativePath.includes('lib/') && !relativePath.includes('components/')) {
      continue;
    }
    
    for (const exportName of exports) {
      // Buscar uso del export en otros archivos
      let isUsed = false;
      
      for (const otherFile of allFiles) {
        if (otherFile === file) continue;
        
        try {
          const content = fs.readFileSync(otherFile, 'utf-8');
          
          // Buscar uso del export (búsqueda básica)
          if (exportName !== 'default') {
            const importPattern = new RegExp(`import\\s+.*\\b${exportName}\\b.*from`, 'g');
            const destructurePattern = new RegExp(`\\b${exportName}\\b`, 'g');
            
            if (importPattern.test(content) || destructurePattern.test(content)) {
              isUsed = true;
              break;
            }
          }
        } catch (error) {
          // Ignorar errores
        }
      }
      
      if (!isUsed && exportName !== 'default') {
        orphanedExports.push({
          file: relativePath,
          exportName,
        });
      }
    }
  }
  
  return { orphanedFiles, orphanedExports };
}

async function main() {
  try {
    const { orphanedFiles, orphanedExports } = await detectOrphanedCode();
    
    console.log('📊 RESULTADOS:\n');
    
    if (orphanedFiles.length === 0 && orphanedExports.length === 0) {
      console.log('✅ No se encontró código huérfano.\n');
      process.exit(0);
    }
    
    if (orphanedFiles.length > 0) {
      console.log('📁 ARCHIVOS HUÉRFANOS (no se importan):\n');
      orphanedFiles.forEach(({ path, reason }) => {
        console.log(`   ❌ ${path}`);
        console.log(`      Razón: ${reason}\n`);
      });
    }
    
    if (orphanedExports.length > 0) {
      console.log('📦 EXPORTS NO USADOS:\n');
      orphanedExports.forEach(({ file, exportName }) => {
        console.log(`   ⚠️  ${file} -> ${exportName}`);
      });
      console.log('');
    }
    
    console.log('💡 RECOMENDACIONES:');
    console.log('   • Revisar cada archivo antes de eliminar');
    console.log('   • Verificar que realmente no se usa');
    console.log('   • Considerar si es código de desarrollo/debug');
    console.log('   • Eliminar solo si está confirmado que no se necesita\n');
    
    // Exit code 1 si hay código huérfano (para CI/CD)
    process.exit(orphanedFiles.length > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Error ejecutando script:', error);
    process.exit(1);
  }
}

main();

