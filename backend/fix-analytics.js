const fs = require('fs');

// Read the analytics file
let content = fs.readFileSync('routes/analytics.js', 'utf8');

// Remove duplicate overview route (everything after line 415)
const lines = content.split('\n');
const cleanLines = lines.slice(0, 415);

// Write back the cleaned content
fs.writeFileSync('routes/analytics.js', cleanLines.join('\n'));

console.log('Analytics file cleaned - removed duplicate routes');
