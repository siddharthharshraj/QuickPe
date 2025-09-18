#!/usr/bin/env node

// Script to fix missing Heroicons imports
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

class IconImportFixer {
  constructor() {
    this.fixes = [];
    this.errors = [];
    
    // Common Heroicons that might be used
    this.commonIcons = [
      'ArrowRightIcon', 'ArrowLeftIcon', 'ArrowUpIcon', 'ArrowDownIcon',
      'BanknotesIcon', 'CurrencyRupeeIcon', 'CurrencyDollarIcon',
      'UserIcon', 'UserGroupIcon', 'UsersIcon',
      'ClockIcon', 'CalendarIcon', 'CalendarDaysIcon',
      'ChartBarIcon', 'ChartPieIcon', 'ChartLineIcon',
      'PlusIcon', 'MinusIcon', 'XMarkIcon', 'CheckIcon',
      'ArrowTrendingUpIcon', 'ArrowTrendingDownIcon',
      'EyeIcon', 'EyeSlashIcon', 'PencilIcon', 'TrashIcon',
      'Cog6ToothIcon', 'BellIcon', 'HomeIcon', 'DocumentIcon',
      'FolderIcon', 'MagnifyingGlassIcon', 'Bars3Icon',
      'EnvelopeIcon', 'PhoneIcon', 'MapPinIcon',
      'ShieldCheckIcon', 'LockClosedIcon', 'KeyIcon',
      'CreditCardIcon', 'BuildingBankIcon', 'ReceiptPercentIcon'
    ];
  }

  async fixIconImports() {
    console.log('🎨 Fixing Heroicons imports...');

    try {
      await this.scanAndFixFiles();
      this.displayResults();
      
      if (this.errors.length > 0) {
        console.log('\n⚠️  Some files had issues, but fixes were applied where possible');
      } else {
        console.log('\n✅ All Heroicons imports fixed successfully!');
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
      
      // Find all icon usage in the file
      const usedIcons = new Set();
      
      // Look for icon usage patterns
      const iconPatterns = [
        /(\w+Icon)(?=\s*[,})\]])/g,  // Icon in object/array
        /icon:\s*(\w+Icon)/g,        // icon: IconName
        /Icon=\{(\w+Icon)\}/g,       // Icon={IconName}
        /<(\w+Icon)/g                // <IconName
      ];

      iconPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const iconName = match[1];
          if (this.commonIcons.includes(iconName)) {
            usedIcons.add(iconName);
          }
        }
      });

      if (usedIcons.size > 0) {
        await this.fixFileIconImports(filePath, fileName, content, usedIcons);
      }
      
    } catch (error) {
      this.errors.push(`${fileName}: ${error.message}`);
    }
  }

  async fixFileIconImports(filePath, fileName, content, usedIcons) {
    // Check if Heroicons is already imported
    const heroiconsImportMatch = content.match(/import\s*{([^}]+)}\s*from\s*['"]@heroicons\/react\/24\/outline['"]/);
    
    if (heroiconsImportMatch) {
      // Parse existing imports
      const existingImports = heroiconsImportMatch[1]
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp.length > 0);

      const missingIcons = Array.from(usedIcons).filter(icon => !existingImports.includes(icon));
      
      if (missingIcons.length > 0) {
        const allImports = [...existingImports, ...missingIcons].sort();
        const newImportLine = `import { \n  ${allImports.join(',\n  ')}\n} from '@heroicons/react/24/outline';`;
        
        const newContent = content.replace(heroiconsImportMatch[0], newImportLine);
        await fs.writeFile(filePath, newContent, 'utf-8');
        this.fixes.push(`${fileName}: Added missing icons: ${missingIcons.join(', ')}`);
      }
    } else {
      // No Heroicons import exists, add one
      const iconsArray = Array.from(usedIcons).sort();
      const newImportLine = `import { \n  ${iconsArray.join(',\n  ')}\n} from '@heroicons/react/24/outline';\n`;
      
      // Find React import to add after it
      const reactImportMatch = content.match(/import React[^;]*;/);
      if (reactImportMatch) {
        const reactImportLine = reactImportMatch[0];
        const newContent = content.replace(
          reactImportLine,
          `${reactImportLine}\n${newImportLine}`
        );
        
        await fs.writeFile(filePath, newContent, 'utf-8');
        this.fixes.push(`${fileName}: Added Heroicons import with: ${iconsArray.join(', ')}`);
      } else {
        // Add at the top
        const newContent = newImportLine + content;
        await fs.writeFile(filePath, newContent, 'utf-8');
        this.fixes.push(`${fileName}: Added Heroicons import at top with: ${iconsArray.join(', ')}`);
      }
    }
  }

  displayResults() {
    console.log('\n📊 Icon Import Fix Results:');
    console.log('============================');
    
    if (this.fixes.length > 0) {
      console.log('\n✅ Fixed:');
      this.fixes.forEach(fix => console.log(`  • ${fix}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  • ${error}`));
    }
    
    if (this.fixes.length === 0 && this.errors.length === 0) {
      console.log('✅ No Heroicons import issues found!');
    }
  }
}

// Run the fixer
const fixer = new IconImportFixer();
fixer.fixIconImports().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
