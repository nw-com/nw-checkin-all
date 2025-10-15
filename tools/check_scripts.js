const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
// Allow passing target HTML file via CLI arg; default to index.html
const targetHtml = process.argv[2] && process.argv[2].trim() ? process.argv[2].trim() : 'index.html';
const indexPath = path.isAbsolute(targetHtml) ? targetHtml : path.join(root, targetHtml);

function extractScripts(html) {
  const scripts = [];
  const re = /<script[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    scripts.push(m[1]);
  }
  return scripts;
}

function countBackticks(str) {
  // naive count; sufficient to spot odd-number issue
  return (str.match(/`/g) || []).length;
}

function countDelimiters(str) {
  return {
    parenOpen: (str.match(/\(/g) || []).length,
    parenClose: (str.match(/\)/g) || []).length,
    braceOpen: (str.match(/\{/g) || []).length,
    braceClose: (str.match(/\}/g) || []).length,
    bracketOpen: (str.match(/\[/g) || []).length,
    bracketClose: (str.match(/\]/g) || []).length,
    backticks: (str.match(/`/g) || []).length,
    quotes: (str.match(/"/g) || []).length,
    apostrophes: (str.match(/'/g) || []).length,
  };
}

function main() {
  const html = fs.readFileSync(indexPath, 'utf8');
  const scripts = extractScripts(html);
  console.log(`Found ${scripts.length} <script> blocks in ${path.basename(indexPath)}`);
  scripts.forEach((code, i) => {
    const btCount = countBackticks(code);
    const counts = countDelimiters(code);
    try {
      // Strip out bare import/export lines to allow parse checking
      const sanitized = code
        .replace(/^\s*import[^;]+;?/mg, '')
        .replace(/^\s*export\s+\{[^}]*\};?/mg, '')
        .replace(/^\s*export\s+default[^;]*;?/mg, '');
      new Function(sanitized);
      console.log(`[OK] Script #${i} compiled (sanitized). Backticks: ${btCount}`);
      console.log('Counts:', counts);
    } catch (e) {
      console.log(`[ERROR] Script #${i} failed: ${e && e.message}`);
      console.log(`Backticks: ${btCount}`);
      console.log('Counts:', counts);
      const preview = code.slice(Math.max(0, code.length - 400));
      console.log(`Tail Preview:\n${preview}`);
    }
  });
}

main();