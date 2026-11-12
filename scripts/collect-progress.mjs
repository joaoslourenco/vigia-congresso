import fs from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const root=new URL('../dist/data/',import.meta.url);
const array=v=>Array.isArray(v)?v:[];
export function normalizeProgress(p,house,checkedAt){
 if(house==='Câmara'){
  const s=p.statusProposicao||{};
  return {situation:s.descricaoSituacao||null,body:s.siglaOrgao||null,bodyUrl:s.uriOrgao||null,lastAction:s.despacho||s.descricaoTramitacao||null,actionAt:s.dataHora||null,lastRapporteurUrl:s.uriUltimoRelator||null,awaitingRapporteur:/aguardando.*designa.*relator/i.test(s.descricaoSituacao||''),checkedAt};
 }
 const units=array(p.autuacoes).filter(a=>a.nomeColegiadoControleAtual||a.nomeEnteControleAtual);
 const infos=array(p.autuacoes).flatMap(a=>array(a.informesLegislativos)).sort((a,b)=>(b.data||'').localeCompare(a.data||''));
 return {situation:p.situacaoAtual||null,body:[...new Set(units.map(a=>[a.nomeColegiadoControleAtual,a.siglaColegiadoControleAtual?`(${a.siglaColegiadoControleAtual})`:null].filter(Boolean).join(' ')||a.nomeEnteControleAtual))].join('; ')||null,lastAction:infos[0]?.descricao||null,actionAt:infos[0]?.data||p.dataSituacaoAtual||null,awaitingRapporteur:/aguardando.*designa.*relator/i.test(p.situacaoAtual||''),checkedAt};
}
export async function collectProgress(){
 const index=JSON.parse(await fs.readFile(new URL('index.json',root),'utf8')),proposals=new Map;
 for(const m of index.months){const d=JSON.parse(await fs.readFile(new URL(m.month+'.json',root),'utf8'));for(const p of d.proposals)proposals.set(p.id,p)}
 let previous={proposals:{}};try{previous=JSON.parse(await fs.readFile(new URL('progress.json',root),'utf8'))}catch{}
 const output={proposals:{...previous.proposals}},queue=[...proposals.values()],memo=new Map;
 async function get(url){if(!memo.has(url))memo.set(url,(async()=>{let error;for(let n=0;n<2;n++)try{const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('HTTP '+r.status);return await r.json()}catch(e){error=e}throw error})());return memo.get(url)}
 await Promise.all(Array.from({length:4},async()=>{while(queue.length){const p=queue.shift();try{
  const raw=await get(p.dataSource),entry=normalizeProgress(raw.dados||raw,p.house,new Date().toISOString());
  if(entry.bodyUrl)try{const org=(await get(entry.bodyUrl)).dados;entry.body=[org.nome,org.sigla?`(${org.sigla})`:null].filter(Boolean).join(' ')||entry.body}catch{}
  if(entry.lastRapporteurUrl&&!entry.awaitingRapporteur)try{entry.lastRapporteur=(await get(entry.lastRapporteurUrl)).dados.nome}catch{}
  output.proposals[p.id]={...entry,source:p.source};
 }catch(e){output.proposals[p.id]={...output.proposals[p.id],error:'Não foi possível atualizar o andamento nesta consulta.',source:p.source};console.error(p.id+': '+e.message)}}}));
 await fs.writeFile(new URL('progress.json',root),JSON.stringify(output,null,2)+'\n');
 console.log('Andamentos consultados: '+proposals.size);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await collectProgress();
