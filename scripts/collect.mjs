// Conservative collector: archive official responses; never infer completed coverage.
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const root=new URL('../',import.meta.url),now=new Date(),end=process.env.COLLECTION_TO||new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now),start=process.env.COLLECTION_FROM||new Date(new Date(end+'T12:00:00Z').getTime()-14*864e5).toISOString().slice(0,10);
async function fetchJSON(url){const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`${r.status}: ${url}`);return r.json()}
async function archive(source,url,data){const text=JSON.stringify(data,null,2)+'\n',hash=crypto.createHash('sha256').update(text).digest('hex');const dir=new URL(`raw/${source}/`,root);await fs.mkdir(dir,{recursive:true});const file=new URL(hash+'.json',dir);try{await fs.access(file)}catch{await fs.writeFile(file,text)}return {source,url,sha256:hash}}
const refs=[],errors=[];
for(const type of ['PLP','PEC']){
 try{let url=`https://dadosabertos.camara.leg.br/api/v2/proposicoes?siglaTipo=${type}&dataApresentacaoInicio=${start}&dataApresentacaoFim=${end}&itens=100&ordem=ASC&ordenarPor=id`;const seen=new Set;while(url){if(seen.has(url))throw Error('Paginação circular');seen.add(url);const page=await fetchJSON(url);if(!Array.isArray(page.dados))throw Error('Resposta inválida da Câmara');refs.push(await archive('camara',url,page));for(const p of page.dados){for(const suffix of ['','/autores','/tramitacoes','/votacoes']){const detail=`https://dadosabertos.camara.leg.br/api/v2/proposicoes/${p.id}${suffix}`;const data=await fetchJSON(detail);refs.push(await archive('camara',detail,data))}}url=page.links?.find(l=>l.rel==='next')?.href}}
 catch(e){errors.push({source:'camara',type,error:e.message})}

}
// Raw archives are immutable. Mapping and nominal vote reconciliation require review.
// Do not mark days complete or publish rankings from unreviewed snapshots.
await fs.mkdir(new URL('raw/',root),{recursive:true});
const result={window:{start,end},status:'partial',refs:refs.sort((a,b)=>a.url.localeCompare(b.url)),errors,normalizationPending:true};
await fs.writeFile(new URL('raw/latest.json',root),JSON.stringify(result,null,2)+'\n');
console.log(`Archived ${refs.length} official responses; ${errors.length} source errors. Coverage remains partial.`);
try { const {collectSenado}=await import('./collect-senado.mjs'); await collectSenado(); } catch(e) { console.error(e.message); errors.push({source:'senado',error:e.message}); }
if(errors.length)process.exitCode=1;
