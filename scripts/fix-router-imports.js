#!/usr/bin/env node

// Script to fix missing React Router imports
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class RouterImportFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
  }

  async fixRouterImports() {
    console.log('🔧 Fixing React Router imports...');

    try {
      await this.scanAndFixFiles();
      this.displayResults();
      
      if (this.errors.length > 0) {
        console.log('\n⚠️  Some files had issues, but fixes were applied where possible');
      } else {
        console.log('\n✅ All React Router imports fixed successfully!');
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
      
      // Check if file uses React Router hooks
      const usesNavigate = content.includes('useNavigate');
      const usesLocation = content.includes('useLocation');
      const usesParams = content.includes('useParams');
      const usesSearchParams = content.includes('useSearchParams');
      
      // Check if React Router is already imported
      const hasRouterImport = content.includes("from 'react-router-dom'");
      
      if ((usesNavigate || usesLocation || usesParams || usesSearchParams) && !hasRouterImport) {
        await this.fixFileImports(filePath, fileName, content, {
          usesNavigate,
          usesLocation,
          usesParams,
          usesSearchParams
        });
      } else if ((usesNavigate || usesLocation || usesParams || usesSearchParams) && hasRouterImport) {
        // Check if the specific hooks are imported
        await this.validateExistingImports(filePath, fileName, content, {
          usesNavigate,
          usesLocation,
          usesParams,
          usesSearchParams
        });
      }
      
    } catch (error) {
      this.errors.push(`${fileName}: ${error.message}`);
    }
  }

  async fixFileImports(filePath, fileName, content, hooks) {
    const neededHooks = [];
    
    if (hooks.usesNavigate) neededHooks.push('useNavigate');
    if (hooks.usesLocation) neededHooks.push('useLocation');
    if (hooks.usesParams) neededHooks.push('useParams');
    if (hooks.usesSearchParams) neededHooks.push('useSearchParams');

    // Check for any existing router imports first to avoid duplicates
    const existingRouterImports = content.match(/import\s*{[^}]*}\s*from\s*['"]react-router-dom['"]/g);
    if (existingRouterImports && existingRouterImports.length > 1) {
      // Multiple router imports exist, consolidate them
      await this.consolidateRouterImports(filePath, fileName, content, neededHooks);
      return;
    }

    // Find the React import line
    const reactImportMatch = content.match(/import React[^;]*;/);
    if (reactImportMatch) {
      const reactImportLine = reactImportMatch[0];
      const routerImport = `import { ${neededHooks.join(', ')} } from 'react-router-dom';`;
      
      const newContent = content.replace(
        reactImportLine,
        `${reactImportLine}\n${routerImport}`
      );
      
      await fs.writeFile(filePath, newContent, 'utf-8');
      this.fixes.push(`${fileName}: Added ${neededHooks.join(', ')} imports`);
    } else {
      // Add import at the top
      const routerImport = `import { ${neededHooks.join(', ')} } from 'react-router-dom';\n`;
      const newContent = routerImport + content;
      
      await fs.writeFile(filePath, newContent, 'utf-8');
      this.fixes.push(`${fileName}: Added ${neededHooks.join(', ')} imports at top`);
    }
  }

  async consolidateRouterImports(filePath, fileName, content, neededHooks) {
    // Find all router imports
    const routerImportMatches = content.match(/import\s*{[^}]*}\s*from\s*['"]react-router-dom['"]/g);
    
    if (routerImportMatches) {
      const allImports = new Set(neededHooks);
      
      // Extract all existing imports
      routerImportMatches.forEach(importLine => {
        const match = importLine.match(/import\s*{([^}]+)}\s*from/);
        if (match) {
          const imports = match[1].split(',').map(imp => imp.trim()).filter(imp => imp.length > 0);
          imports.forEach(imp => allImports.add(imp));
        }
      });

      // Create consolidated import
      const consolidatedImport = `import { ${Array.from(allImports).sort().join(', ')} } from 'react-router-dom';`;
      
      // Remove all existing router imports and add the consolidated one
      let newContent = content;
      routerImportMatches.forEach(importLine => {
        newContent = newContent.replace(importLine, '');
      });
      
      // Add consolidated import after React import or at top
      const reactImportMatch = newContent.match(/import React[^;]*;/);
      if (reactImportMatch) {
        const reactImportLine = reactImportMatch[0];
        newContent = newContent.replace(
          reactImportLine,
          `${reactImportLine}\n${consolidatedImport}`
        );
      } else {
        newContent = consolidatedImport + '\n' + newContent;
      }
      
      // Clean up extra newlines
      newContent = newContent.replace(/\n\n\n+/g, '\n\n');
      
      await fs.writeFile(filePath, newContent, 'utf-8');
      this.fixes.push(`${fileName}: Consolidated duplicate router imports`);
    }
  }

  async validateExistingImports(filePath, fileName, content, hooks) {
    const routerImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]react-router-dom['"]/);
    
    if (routerImportMatch) {
      const existingImports = routerImportMatch[1]
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp.length > 0);

      const neededHooks = [];
      if (hooks.usesNavigate && !existingImports.includes('useNavigate')) {
        neededHooks.push('useNavigate');
      }
      if (hooks.usesLocation && !existingImports.includes('useLocation')) {
        neededHooks.push('useLocation');
      }
      if (hooks.usesParams && !existingImports.includes('useParams')) {
        neededHooks.push('useParams');
      }
      if (hooks.usesSearchParams && !existingImports.includes('useSearchParams')) {
        neededHooks.push('useSearchParams');
      }

      if (neededHooks.length > 0) {
        const allImports = [...existingImports, ...neededHooks];
        const newImportLine = `import { ${allImports.join(', ')} } from 'react-router-dom'`;
        
        const newContent = content.replace(routerImportMatch[0], newImportLine);
        await fs.writeFile(filePath, newContent, 'utf-8');
        this.fixes.push(`${fileName}: Added missing ${neededHooks.join(', ')} to existing import`);
      }
    }
  }

  displayResults() {
    console.log('\n📊 Router Import Fix Results:');
    console.log('===============================');
    
    if (this.fixes.length > 0) {
      console.log('\n✅ Fixed:');
      this.fixes.forEach(fix => console.log(`  • ${fix}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.fixes.length === 0 && this.errors.length === 0) {
      console.log('✅ No React Router import issues found!');
    }
  }
}

// Run the fixer
const fixer = new RouterImportFixer();
fixer.fixRouterImports().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
