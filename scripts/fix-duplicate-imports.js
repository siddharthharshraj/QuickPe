#!/usr/bin/env node

// Script to detect and fix duplicate imports
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class DuplicateImportFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  async fixDuplicateImports() {
    console.log('🔧 Fixing duplicate imports...');

    try {
      await this.scanAndFixFiles();
      this.displayResults();
      
      if (this.errors.length > 0) {
        console.log('\n⚠️  Some files had issues, but fixes were applied where possible');
      } else {
        console.log('\n✅ All duplicate imports fixed successfully!');
      }
      
    } catch (error) {
      console.error('❌ Fix failed:', error.message);
      process.exit(1);
    }
  }

  async scanAndFixFiles() {
    const directories = [
      path.join(projectRoot, 'frontend', 'src', 'pages'),
      path.join(projectRoot, 'frontend', 'src', 'components')
    ];

    for (const dir of directories) {
      await this.processDirectory(dir);
    }
  }

  async processDirectory(dirPath) {
    try {
      const files = await fs.readdir(dirPath);
      const jsxFiles = files.filter(file => file.endsWith('.jsx'));

      for (const file of jsxFiles) {
        await this.processFile(path.join(dirPath, file), file);
      }
    } catch (error) {
      this.errors.push(`Failed to process directory ${dirPath}: ${error.message}`);
    }
  }

  async processFile(filePath, fileName) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check for duplicate imports from the same source
      const duplicates = this.findDuplicateImports(content);
      
      if (duplicates.length > 0) {
        await this.fixFileDuplicates(filePath, fileName, content, duplicates);
      }
      
    } catch (error) {
      this.errors.push(`${fileName}: ${error.message}`);
    }
  }

  findDuplicateImports(content) {
    const importLines = content.match(/import\s+.*?from\s+['"][^'"]+['"];?/g) || [];
    const importMap = new Map();
    const duplicates = [];

    importLines.forEach((importLine, index) => {
      const sourceMatch = importLine.match(/from\s+['"]([^'"]+)['"]/);
      if (sourceMatch) {
        const source = sourceMatch[1];
        
        if (importMap.has(source)) {
          importMap.get(source).push({ line: importLine, index });
        } else {
          importMap.set(source, [{ line: importLine, index }]);
        }
      }
    });

    // Find sources with multiple imports
    importMap.forEach((imports, source) => {
      if (imports.length > 1) {
        duplicates.push({ source, imports });
      }
    });

    return duplicates;
  }

  async fixFileDuplicates(filePath, fileName, content, duplicates) {
    let newContent = content;
    let fixedSources = [];

    for (const { source, imports } of duplicates) {
      try {
        newContent = await this.consolidateImports(newContent, source, imports);
        fixedSources.push(source);
      } catch (error) {
        this.errors.push(`${fileName}: Failed to consolidate imports from ${source} - ${error.message}`);
      }
    }

    if (fixedSources.length > 0) {
      await fs.writeFile(filePath, newContent, 'utf-8');
      this.fixes.push(`${fileName}: Consolidated duplicate imports from: ${fixedSources.join(', ')}`);
    }
  }

  async consolidateImports(content, source, imports) {
    const allImports = new Set();
    const importTypes = {
      default: null,
      named: new Set(),
      namespace: null
    };

    // Parse all imports from this source
    imports.forEach(({ line }) => {
      const namedMatch = line.match(/import\s*{([^}]+)}\s*from/);
      const defaultMatch = line.match(/import\s+(\w+)(?:\s*,\s*{[^}]*})?\s*from/);
      const namespaceMatch = line.match(/import\s*\*\s*as\s+(\w+)\s*from/);

      if (namedMatch) {
        const namedImports = namedMatch[1].split(',').map(imp => imp.trim()).filter(imp => imp.length > 0);
        namedImports.forEach(imp => importTypes.named.add(imp));
      }

      if (defaultMatch && !namedMatch) {
        importTypes.default = defaultMatch[1];
      }

      if (namespaceMatch) {
        importTypes.namespace = namespaceMatch[1];
      }
    });

    // Build consolidated import
    let consolidatedImport = 'import ';
    const parts = [];

    if (importTypes.default) {
      parts.push(importTypes.default);
    }

    if (importTypes.namespace) {
      parts.push(`* as ${importTypes.namespace}`);
    }

    if (importTypes.named.size > 0) {
      const namedImports = Array.from(importTypes.named).sort().join(', ');
      parts.push(`{ ${namedImports} }`);
    }

    consolidatedImport += parts.join(', ') + ` from '${source}';`;

    // Remove all existing imports from this source
    let newContent = content;
    imports.forEach(({ line }) => {
      newContent = newContent.replace(line, '');
    });

    // Add consolidated import at the appropriate location
    const firstImportMatch = newContent.match(/import\s+.*?from\s+['"][^'"]+['"];?/);
    if (firstImportMatch) {
      newContent = newContent.replace(firstImportMatch[0], `${consolidatedImport}\n${firstImportMatch[0]}`);
    } else {
      newContent = consolidatedImport + '\n' + newContent;
    }

    // Clean up extra newlines
    newContent = newContent.replace(/\n\n\n+/g, '\n\n');
    newContent = newContent.replace(/^\n+/, '');

    return newContent;
  }

  displayResults() {
    console.log('\n📊 Duplicate Import Fix Results:');
    console.log('==================================');
    
    if (this.fixes.length > 0) {
      console.log('\n✅ Fixed:');
      this.fixes.forEach(fix => console.log(`  • ${fix}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.fixes.length === 0 && this.errors.length === 0) {
      console.log('✅ No duplicate import issues found!');
    }
  }
}

// Run the fixer
const fixer = new DuplicateImportFixer();
fixer.fixDuplicateImports().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
