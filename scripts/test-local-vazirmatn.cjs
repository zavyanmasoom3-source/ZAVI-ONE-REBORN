#!/usr/bin/env node
/* Verifies actual offline font bytes, licence, Pashto Unicode cmap, and SW assets.
 * Read-only: no accounting, auth, network or database operations.
 */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const base=path.join(root,'packages/shared/ui');
const font=fs.readFileSync(path.join(base,'fonts/Vazirmatn-Variable.ttf'));
const license=fs.readFileSync(path.join(base,'fonts/OFL.txt'),'utf8');
const css=fs.readFileSync(path.join(base,'design-system-v1.css'),'utf8');
assert.ok(font.length>200000,'Local variable font must be bundled in full');
assert.match(license,/SIL OPEN FONT LICENSE Version 1\.1/);
assert.match(css,/@font-face\s*\{/);
assert.ok(css.includes('./fonts/Vazirmatn-Variable.ttf'),'Missing local @font-face URL');
const word16=p=>font.readUInt16BE(p),word32=p=>font.readUInt32BE(p);
assert.equal(font.readUInt32BE(0),0x00010000,'Expected OpenType TrueType sfnt');
let cmap=-1;
for(let i=0;i<word16(4);i++){
 const pos=12+i*16;
 if(font.toString('ascii',pos,pos+4)==='cmap'){
   cmap=word32(pos+8);break;
 }
}
assert.ok(cmap>=0,'Font lacks Unicode cmap');
function glyphAt(code){
 const maps=word16(cmap+2);
 for(let index=0;index<maps;index++){
   const pos=cmap+4+8*index;
   const table=cmap+word32(pos+4);
   if(word16(table)!==4)continue;
   const segments=word16(table+6)/2;
   for(let i=0;i<segments;i++){
     const end=word16(table+14+i*2);
     const start=word16(table+16+segments*2+i*2);
     if(code<start||code>end)continue;
     const delta=word16(table+16+segments*4+i*2);
     const rpos=table+16+segments*6+i*2;
     const range=word16(rpos);
     if(!range)return (code+delta)&65535;
     const address=rpos+range+2*(code-start);
     assert.ok(address>=0&&address+2<=font.length,'Corrupt cmap offset');
     const id=word16(address);
     return id===0?0:(id+delta)&65535;
   }
 }
 return 0;
}
for(const letter of 'ګډټړږښڼېۍ'){
 assert.ok(glyphAt(letter.codePointAt(0))>0,
   'Missing required Pashto glyph: '+letter);
}
for(const app of ['one','admin']){
 const html=fs.readFileSync(path.join(root,'apps',app,'index.html'),'utf8');
 const sw=fs.readFileSync(path.join(root,'apps',app,'sw.js'),'utf8');
 assert.ok(!/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html),
   app+': online font dependency is forbidden');
 assert.ok(sw.includes('"../../packages/shared/ui/fonts/Vazirmatn-Variable.ttf"'),
   app+': service worker must cache the local font');
}
console.log('PASS: offline licensed variable font, all 9 Pashto glyphs, ONE/ADMIN cache');
