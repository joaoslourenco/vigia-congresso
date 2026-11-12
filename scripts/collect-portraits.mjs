import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const root=new URL('../dist/data/',import.meta.url);
export function officialImage(value){if(!value)return null;try{const url=new URL(value);if(!['senado.leg.br','camara.leg.br'].some(h=>url.hostname===h||url.hostname.endsWith('.'+h)))return null;url.protocol='https:';return url.href}catch{return null}}
export async function collectPortraits(){
 const file=new URL('portraits.json',root);let old={people:{}};try{old=JSON.parse(await fs.readFile(file,'utf8'))}catch{}
 const people={...old.people};try{const response=await fetch('https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json',{headers:{Accept:'application/json'},signal:AbortSignal.timeout(45000)});if(!response.ok)throw Error(`Fotos do Senado: HTTP ${response.status}`);
 const raw=await response.json(),list=raw.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar;if(!Array.isArray(list))throw Error('Lista de parlamentares inválida');
 for(const row of list){const p=row.IdentificacaoParlamentar,photo=officialImage(p?.UrlFotoParlamentar);if(p?.CodigoParlamentar&&photo)people[`senado-parlamentar-${p.CodigoParlamentar}`]={name:p.NomeParlamentar,photo,source:'https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json'}}}catch{console.error('Retratos do Senado indisponíveis; preservando os anteriores.')}
 // Portraits are current identity assets; do not overwrite historical party/UF.
 const index=JSON.parse(await fs.readFile(new URL('index.json',root),'utf8'));
 const deputies=new Set();for(const m of index.months){const d=JSON.parse(await fs.readFile(new URL(m.month+'.json',root),'utf8'));for(const p of d.proposals)for(const a of p.authors||[])if(a.office==='deputado federal'&&/^camara-deputado-\d+$/.test(a.id||'')){const photo=officialImage(a.photo);if(photo)people[a.id]={name:a.name,photo,source:`https://dadosabertos.camara.leg.br/api/v2/deputados/${a.id.split('-').at(-1)}/historico`};else if(!people[a.id])deputies.add(a.id)}}
 for(const id of deputies){const number=id.split('-').at(-1),r=await fetch(`https://dadosabertos.camara.leg.br/api/v2/deputados/${number}`,{signal:AbortSignal.timeout(45000)});if(!r.ok)continue;const d=(await r.json()).dados,photo=officialImage(d?.ultimoStatus?.urlFoto);if(photo)people[id]={name:d.ultimoStatus.nome,photo,source:`https://dadosabertos.camara.leg.br/api/v2/deputados/${number}`}}
 const next={people:Object.fromEntries(Object.entries(people).sort(([a],[b])=>a.localeCompare(b)))};const text=JSON.stringify(next,null,2)+'\n';let previous='';try{previous=await fs.readFile(file,'utf8')}catch{}if(text!==previous)await fs.writeFile(file,text);console.log(`Retratos oficiais disponíveis: ${Object.keys(people).length}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await collectPortraits();
