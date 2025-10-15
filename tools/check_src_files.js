const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'js/dashboard-functions.js',
  'js/features.js',
  'js/other.js',
  'js/calendar.js',
  'clock-in-functions.js',
  'reset-points.js',
];

function countDelimiters(code) {
  const counts = {
    parenOpen: (code.match(/\(/g) || []).length,
    parenClose: (code.match(/\)/g) || []).length,
    braceOpen: (code.match(/\{/g) || []).length,
    braceClose: (code.match(/\}/g) || []).length,
    bracketOpen: (code.match(/\[/g) || []).length,
    bracketClose: (code.match(/\]/g) || []).length,
    backticks: (code.match(/`/g) || []).length,
    quotes: (code.match(/"/g) || []).length,
    apostrophes: (code.match(/'/g) || []).length,
  };
  return counts;
}

function checkFile(file) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    console.log(`[SKIP] ${file} not found`);
    return;
  }
  const code = fs.readFileSync(full, 'utf8');
  const counts = countDelimiters(code);
  try {
    new Function(code);
    console.log(`[OK] ${file} compiled`);
  } catch (e) {
    console.log(`[ERROR] ${file} failed: ${e && e.message}`);
    const tail = code.slice(Math.max(0, code.length - 500));
    console.log('Tail Preview:\n' + tail);
  }
  console.log('Counts:', counts);
}

function main() {
  files.forEach(checkFile);
}

main();