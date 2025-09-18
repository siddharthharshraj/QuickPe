#!/usr/bin/env node

// Component validation script to prevent lazy loading errors
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class ComponentValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  async validateComponents() {
    console.log('🔍 Validating React components...');

    try {
      await this.checkPageComponents();
      await this.checkLazyComponents();
      await this.checkImportExports();
      await this.checkRouterImports();
      await this.checkIconImports();
      
      this.displayResults();
      
      if (this.errors.length > 0) {
        console.log('\n❌ Component validation failed!');
        process.exit(1);
      } else {
        console.log('\n✅ All components validated successfully!');
      }
      
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      process.exit(1);
    }
  }

  async checkPageComponents() {
    const pagesDir = path.join(projectRoot, 'frontend', 'src', 'pages');
    
    try {
      const files = await fs.readdir(pagesDir);
      const jsxFiles = files.filter(file => file.endsWith('.jsx'));
      
      console.log(`📄 Checking ${jsxFiles.length} page components...`);
      
      for (const file of jsxFiles) {
        await this.validateComponentFile(path.join(pagesDir, file), file);
      }
      
    } catch (error) {
      this.errors.push(`Failed to read pages directory: ${error.message}`);
    }
  }

  async checkLazyComponents() {
    const lazyComponentsPath = path.join(projectRoot, 'frontend', 'src', 'components', 'LazyComponents.jsx');
    
    try {
      const content = await fs.readFile(lazyComponentsPath, 'utf-8');
      
      // Check for proper lazy imports
      const lazyImportRegex = /export const Lazy\w+ = (?:createSafeLazyComponent|lazy)\(/g;
      const matches = content.match(lazyImportRegex);
      
      if (matches) {
        console.log(`🔄 Found ${matches.length} lazy component definitions`);
      } else {
        this.warnings.push('No lazy component definitions found in LazyComponents.jsx');
      }
      
      // Check for error handling
      if (content.includes('createSafeLazyComponent')) {
        console.log('✅ Safe lazy loading implementation detected');
      } else {
        this.warnings.push('Consider using safe lazy loading to prevent component errors');
      }
      
    } catch (error) {
      this.errors.push(`Failed to validate LazyComponents.jsx: ${error.message}`);
    }
  }

  async validateComponentFile(filePath, fileName) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check for default export
      if (!content.includes('export default')) {
        this.errors.push(`${fileName}: Missing default export`);
        return;
      }
      
      // Check for React import
      if (!content.includes('import React') && !content.includes('import { ')) {
        this.warnings.push(`${fileName}: No React import found (might be using new JSX transform)`);
      }
      
      // Check for component function/class
      const hasFunction = content.includes('function ') || content.includes('const ') || content.includes('class ');
      if (!hasFunction) {
        this.errors.push(`${fileName}: No component function or class found`);
      }
      
      console.log(`✅ ${fileName} - Valid`);
      
    } catch (error) {
      this.errors.push(`${fileName}: Failed to read file - ${error.message}`);
    }
  }

  async checkImportExports() {
    const appPath = path.join(projectRoot, 'frontend', 'src', 'App.jsx');
    
    try {
      const content = await fs.readFile(appPath, 'utf-8');
      
      // Check if LazyComponents import exists
      if (content.includes('from \'./components/LazyComponents\'')) {
        console.log('✅ LazyComponents import found in App.jsx');
      } else {
        this.errors.push('LazyComponents import not found in App.jsx');
      }
      
      // Check for Suspense usage
      if (content.includes('Suspense')) {
        console.log('✅ Suspense usage detected');
      } else {
        this.warnings.push('No Suspense usage found - lazy components might not work properly');
      }
      
    } catch (error) {
      this.errors.push(`Failed to validate App.jsx: ${error.message}`);
    }
  }

  async checkRouterImports() {
    console.log('🔗 Checking React Router imports...');
    
    const directories = [
      path.join(projectRoot, 'frontend', 'src', 'pages'),
      path.join(projectRoot, 'frontend', 'src', 'components')
    ];

    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        const jsxFiles = files.filter(file => file.endsWith('.jsx'));

        for (const file of jsxFiles) {
          await this.checkFileRouterImports(path.join(dir, file), file);
        }
      } catch (error) {
        this.warnings.push(`Could not check router imports in ${dir}: ${error.message}`);
      }
    }
  }

  async checkFileRouterImports(filePath, fileName) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Check if file uses React Router hooks
      const usesNavigate = content.includes('useNavigate');
      const usesLocation = content.includes('useLocation');
      const usesParams = content.includes('useParams');
      const usesSearchParams = content.includes('useSearchParams');
      
      const usesAnyRouterHook = usesNavigate || usesLocation || usesParams || usesSearchParams;
      
      if (usesAnyRouterHook) {
        // Check if React Router is imported
        const hasRouterImport = content.includes("from 'react-router-dom'");
        
        if (!hasRouterImport) {
          this.errors.push(`${fileName}: Uses React Router hooks but missing import from 'react-router-dom'`);
        } else {
          // Check if specific hooks are imported
          const routerImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]react-router-dom['"]/);
          if (routerImportMatch) {
            const existingImports = routerImportMatch[1]
              .split(',')
              .map(imp => imp.trim())
              .filter(imp => imp.length > 0);

            const missingHooks = [];
            if (usesNavigate && !existingImports.includes('useNavigate')) {
              missingHooks.push('useNavigate');
            }
            if (usesLocation && !existingImports.includes('useLocation')) {
              missingHooks.push('useLocation');
            }
            if (usesParams && !existingImports.includes('useParams')) {
              missingHooks.push('useParams');
            }
            if (usesSearchParams && !existingImports.includes('useSearchParams')) {
              missingHooks.push('useSearchParams');
            }

            if (missingHooks.length > 0) {
              this.errors.push(`${fileName}: Missing React Router hooks in import: ${missingHooks.join(', ')}`);
            }
          }
        }
      }
    } catch (error) {
      this.warnings.push(`${fileName}: Could not check router imports - ${error.message}`);
    }
  }

  async checkIconImports() {
    console.log('🎨 Checking Heroicons imports...');
    
    const directories = [
      path.join(projectRoot, 'frontend', 'src', 'pages'),
      path.join(projectRoot, 'frontend', 'src', 'components')
    ];

    const commonIcons = [
      'ArrowRightIcon', 'ArrowLeftIcon', 'BanknotesIcon', 'CurrencyRupeeIcon',
      'UserIcon', 'UserGroupIcon', 'ClockIcon', 'ChartBarIcon', 'PlusIcon',
      'ArrowTrendingUpIcon', 'ArrowTrendingDownIcon', 'EyeIcon', 'EyeSlashIcon',
      'PencilIcon', 'TrashIcon', 'Cog6ToothIcon', 'BellIcon', 'HomeIcon', 'XMarkIcon',
      'EnvelopeIcon', 'LockClosedIcon', 'MagnifyingGlassIcon', 'PaperAirplaneIcon',
      'UsersIcon', 'DocumentIcon', 'FolderIcon', 'CreditCardIcon', 'BuildingBankIcon'
    ];

    for (const dir of directories) {
      try {
        const files = await fs.readdir(dir);
        const jsxFiles = files.filter(file => file.endsWith('.jsx'));

        for (const file of jsxFiles) {
          await this.checkFileIconImports(path.join(dir, file), file, commonIcons);
        }
      } catch (error) {
        this.warnings.push(`Could not check icon imports in ${dir}: ${error.message}`);
      }
    }
  }

  async checkFileIconImports(filePath, fileName, commonIcons) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Find used icons
      const usedIcons = new Set();
      const iconPatterns = [
        /(\w+Icon)(?=\s*[,})\]])/g,
        /icon:\s*(\w+Icon)/g,
        /Icon=\{(\w+Icon)\}/g,
        /<(\w+Icon)/g
      ];

      iconPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const iconName = match[1];
          if (commonIcons.includes(iconName)) {
            usedIcons.add(iconName);
          }
        }
      });

      if (usedIcons.size > 0) {
        // Check if Heroicons is imported (more flexible pattern)
        const hasHeroiconsImport = content.includes("@heroicons/react/24/outline") || 
                                  content.includes("@heroicons/react/outline");
        
        if (!hasHeroiconsImport) {
          this.errors.push(`${fileName}: Uses Heroicons but missing import from '@heroicons/react/24/outline'`);
        } else {
          // Check if specific icons are imported
          const heroiconsImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]@heroicons\/react\/24\/outline['"]/);
          if (heroiconsImportMatch) {
            const existingImports = heroiconsImportMatch[1]
              .split(',')
              .map(imp => imp.trim())
              .filter(imp => imp.length > 0);

            const missingIcons = Array.from(usedIcons).filter(icon => !existingImports.includes(icon));
            if (missingIcons.length > 0) {
              this.errors.push(`${fileName}: Missing Heroicons in import: ${missingIcons.join(', ')}`);
            }
          }
        }
      }
    } catch (error) {
      this.warnings.push(`${fileName}: Could not check icon imports - ${error.message}`);
    }
  }

  displayResults() {
    console.log('\n📊 Validation Results:');
    console.log('======================');
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  • ${warning}`));
    }
    
    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('✅ No issues found!');
    }
  }
}

// Run validation
const validator = new ComponentValidator();
validator.validateComponents().catch(error => {
  console.error('Fatal validation error:', error);
  process.exit(1);
});
