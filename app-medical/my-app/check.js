const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync('npx eslint . -f json');
  fs.writeFileSync('lint.json', result.toString());
} catch(e) {
  fs.writeFileSync('lint.json', e.stdout ? e.stdout.toString() : e.message);
}

try {
  const result = execSync('npx tsc --noEmit');
  fs.writeFileSync('tsc.txt', result.toString());
} catch(e) {
  fs.writeFileSync('tsc.txt', e.stdout ? e.stdout.toString() : e.message);
}
