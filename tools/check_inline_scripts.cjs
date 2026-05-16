const fs = require('fs');
const s = fs.readFileSync('index.html', 'utf8');
const re = /<script([^>]*)>([\s\S]*?)<\/script>/gi;
let m;let idx=0;let ok=true;
while((m=re.exec(s))){
  const attrs = m[1]||'';
  const code = m[2] || '';
  if(/\bsrc\s*=/.test(attrs)) continue; // skip external scripts
  idx++;
  const trimmed = code.trim();
  if(!trimmed) continue;
  try{
    new Function(trimmed);
    console.log(`inline#${idx}: ok`);
  }catch(e){
    console.error(`inline#${idx}: ERROR -> ${e.message}`);
    ok=false;
  }
}
if(!ok) process.exit(2);
else process.exit(0);
