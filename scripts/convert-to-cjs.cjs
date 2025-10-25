const fs = require('fs');
const path = require('path');

// Files to convert
const filesToConvert = [
  'backend/routes/contact.js',
  'backend/routes/notification.js',
  'backend/routes/realtime.js',
  'backend/routes/statements.js',
  'backend/routes/test-results.js'
];

// Convert a single file to use CommonJS
function convertFileToCJS(filePath) {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Convert import/export to require/module.exports
    content = content.replace(/import\s+([\s\S]*?)\s+from\s+['"]([^'"]+)['"]/g, (match, imports, modulePath) => {
      // Handle default imports
      if (imports.startsWith('{') && imports.endsWith('}')) {
        // Named imports
        return `const ${imports} = require('${modulePath.replace(/\.js$/, '')}');`;
      } else {
        // Default import
        return `const ${imports} = require('${modulePath.replace(/\.js$/, '')}').default || require('${modulePath.replace(/\.js$/, '')}');`;
      }
    });
    
    // Convert export default to module.exports
    content = content.replace(/export\s+default\s+([^;\n]+);?/g, 'module.exports = $1;');
    
    // Convert named exports
    content = content.replace(/export\s+const\s+(\w+)/g, 'const $1');
    content = content.replace(/export\s+function\s+(\w+)/g, 'function $1');
    
    // Add module.exports at the end if there are named exports
    if (content.match(/export\s+{([^}]+)}/)) {
      const exports = content.match(/export\s+{([^}]+)}/)[1]
        .split(',')
        .map(e => e.trim())
        .filter(e => e);
      
      content = content.replace(/export\s+{[^}]+}/, '');
      content += `\nmodule.exports = { ${exports.join(', ')} };\n`;
    }
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Converted ${filePath} to CommonJS`);
  } catch (error) {
    console.error(`❌ Error converting ${filePath}:`, error.message);
  }
}

// Convert all files
filesToConvert.forEach(convertFileToCJS);

// Update service files to export classes
const serviceFiles = [
  'backend/services/config.js',
  'backend/services/db.js',
  'backend/services/healthCheck.js'
];

serviceFiles.forEach(filePath => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // If the file doesn't export a class, wrap it in one
    if (!content.match(/class\s+\w+\s+{/)) {
      const className = path.basename(filePath, '.js').replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const classNamePascal = className.charAt(0).toUpperCase() + className.slice(1);
      
      content = `class ${classNamePascal} {
${content}
}

module.exports = new ${classNamePascal}();
`;
      
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Updated ${filePath} to export a class`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
});

console.log('\n✅ Conversion to CommonJS completed!');
