import fs from 'node:fs/promises';
const source=new URL('../dist/',import.meta.url),output=new URL('../_site/',import.meta.url);
await fs.mkdir(output,{recursive:true});await fs.cp(source,output,{recursive:true});
let before=0,after=0;
async function compact(directory){for(const e of await fs.readdir(directory,{withFileTypes:true})){const file=new URL(e.name+(e.isDirectory()?'/':''),directory);if(e.isDirectory())await compact(file);else if(e.name.endsWith('.json')){const original=await fs.readFile(file,'utf8'),next=JSON.stringify(JSON.parse(original));before+=Buffer.byteLength(original);after+=Buffer.byteLength(next);await fs.writeFile(file,next)}}}
await compact(output);console.log(`JSON público compactado: ${before} → ${after} bytes. Fonte e histórico preservados.`);
