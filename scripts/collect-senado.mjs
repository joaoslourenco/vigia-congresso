import {storeSnapshot} from './snapshot-storage.mjs';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';
const root=new URL('../',import.meta.url),dataRoot=new URL('dist/data/',root);
const array=v=>v==null?[]:Array.isArray(v)?v:[v];
async function get(url){let error;for(let i=0;i<3;i++){try{const r=await fetch(url,{headers:{Accept:'application/json'},signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`HTTP ${r.status}`);return await r.json()}catch(e){error=e}}throw error}
async function writeChanged(url,value){const text=JSON.stringify(value,null,2)+'\n';try{if(await fs.readFile(url,'utf8')===text)return false}catch{}await fs.mkdir(new URL('./',url),{recursive:true});await fs.writeFile(url,text);return true}
async function archive(url,value){const hash=crypto.createHash('sha256').update(JSON.stringify(value)).digest('hex');await storeSnapshot(new URL('raw/senado/',root),hash,{source:url,data:value});return hash}
export function normalizeProcess(p,collectedAt,from,to){
 if(!['PLP','PEC'].includes(p.sigla)||!p.id||!p.codigoMateria)throw Error('Processo sem identificação válida');
 const id=`senado-processo-${p.id}`,doc=p.documento||{};
 const officialAuthors=doc.resumoAutoria||'';
 let conflict=false;
 const authors=array(doc.autoria||p.autoriaIniciativa).map(a=>{
   // Preserve the party/UF printed in the original authorship summary where it can be matched.
   const name=a.autor||'',escaped=name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
   const recorded=officialAuthors.match(new RegExp(escaped+' \\(([^()]*)/([A-Z]{2})\\)'));
   if(recorded&&a.siglaPartido&&recorded[1]!==a.siglaPartido)conflict=true;
   return {id:a.codigoParlamentar?`senado-parlamentar-${a.codigoParlamentar}`:null,name,party:recorded?.[1]||a.siglaPartido||null,state:recorded?.[2]||a.uf||null,office:a.siglaTipo==='SENADOR'?'senador':a.siglaTipo==='DEPUTADO'?'deputado federal':a.descricaoTipo||'não informado',role:'autoria conjunta',order:a.ordem,partyContext:recorded?'resumo oficial da autoria':'vínculo informado na consulta; contexto histórico não confirmado'};
 });
 // Order of signatures is not proof of principal authorship. Keep joint authorship separate.
 const proposal={id,officialMatterId:String(p.codigoMateria),officialProcessId:String(p.id),house:'Senado',type:p.sigla,number:Number(p.numero),year:p.ano,presentedAt:doc.dataApresentacao||p.dataInicioEfetivo,officialSummary:p.conteudo?.ementa||'',authorSummary:officialAuthors,authors,source:`https://www25.senado.leg.br/web/atividade/materias/-/materia/${p.codigoMateria}`,dataSource:`https://legis.senado.leg.br/dadosabertos/processo/${p.id}`,stage:p.situacaoAtual,history:[],collectedAt,authorshipNote:'O Senado informa ordem de assinatura; ela não foi interpretada como autoria principal. Os registros ficam na categoria de autoria conjunta.',conflict};
 const events=[];
 for(const a of array(p.autuacoes))for(const info of array(a.informesLegislativos)){
   if(!info.id||!/^\d{4}-\d{2}-\d{2}/.test(info.data||''))continue;
   const date=info.data.slice(0,10);if(date<from||date>to)continue;
   const stage=array(a.situacoes).find(s=>s.idTipo===info.idSituacaoIniciada)?.descricao||info.siglaSituacaoIniciada||null;
   events.push({id:`senado-informe-${info.id}`,proposalId:id,date,occurredAt:info.data,kind:'Tramitação',description:info.descricao||'Informe legislativo oficial',stage,target:'Objeto não classificado pela coleta',scheduled:false,collectedAt,source:proposal.dataSource,conflict,vote:null});
 }
 const uniqueEvents=[...new Map(events.map(e=>[e.id,e])).values()];
 proposal.history=uniqueEvents.map(e=>({date:e.date,description:e.description})).sort((a,b)=>b.date.localeCompare(a.date));
 return {proposal,events:uniqueEvents};
}
export async function collectSenado({from=process.env.COLLECTION_FROM||'2026-11-01',to=process.env.COLLECTION_TO||new Date().toISOString().slice(0,10),year=Number(process.env.SENADO_YEAR||2026)}={}){
 const collectedAt=new Date().toISOString(),errors=[],processes=new Map(),types=[];let contentChanged=false;
 for(const type of ['PLP','PEC']){const url=`https://legis.senado.leg.br/dadosabertos/processo?sigla=${type}&ano=${year}`;try{const list=await get(url);if(!Array.isArray(list))throw Error('Resposta de pesquisa inesperada');await archive(url,list);for(const p of list){if(!p.id)throw Error('Pesquisa sem identificador de processo');processes.set(String(p.id),p)}types.push(type)}catch(e){errors.push({type,url,error:e.message})}}
 const normalized=[],queue=[...processes.keys()];
 await Promise.all(Array.from({length:4},async()=>{while(queue.length){const id=queue.shift(),url=`https://legis.senado.leg.br/dadosabertos/processo/${id}`;try{const p=await get(url);await archive(url,p);const result=normalizeProcess(p,collectedAt,from,to);if(result.events.length||result.proposal.presentedAt>=from&&result.proposal.presentedAt<=to)normalized.push(result)}catch(e){errors.push({id,url,error:e.message})}}}));
 const index=JSON.parse(await fs.readFile(new URL('index.json',dataRoot),'utf8'));
 const months=new Set(index.months.map(m=>m.month));for(const n of normalized){for(const e of n.events)months.add(e.date.slice(0,7));if(n.proposal.presentedAt>=from&&n.proposal.presentedAt<=to)months.add(n.proposal.presentedAt.slice(0,7))}
 for(const month of [...months].sort()){
   let d;try{d=JSON.parse(await fs.readFile(new URL(month+'.json',dataRoot),'utf8'))}catch{d={month,days:{},proposals:[],events:[]}}
   const proposals=new Map(d.proposals.map(p=>[p.id,p])),events=new Map(d.events.map(e=>[e.id,e]));
   const keepTimestamp=(old,next)=>{if(!old)return next;if(old.officialSummary&&old.officialSummary===next.officialSummary){for(const key of ['summary','summaryMethod','summaryLabel','summarySourceHash','aiSummary'])if(key in old)next[key]=old[key]}const {collectedAt:previous,...a}=old,{collectedAt:current,...b}=next;return JSON.stringify(a)===JSON.stringify(b)?old:next};
   for(const n of normalized){const monthly=n.events.filter(e=>e.date.startsWith(month));if(monthly.length||n.proposal.presentedAt?.startsWith(month)){proposals.set(n.proposal.id,keepTimestamp(proposals.get(n.proposal.id),n.proposal));for(const e of monthly)events.set(e.id,keepTimestamp(events.get(e.id),e))}}
   d.proposals=[...proposals.values()].sort((a,b)=>a.id.localeCompare(b.id));d.events=[...events.values()].sort((a,b)=>b.date.localeCompare(a.date)||a.id.localeCompare(b.id));
   for(const e of d.events.filter(e=>e.id.startsWith('senado-'))){d.days[e.date]={...d.days[e.date],status:'partial',sources:{...d.days[e.date]?.sources,senado:'partial'},reason:`Consultados processos PLP/PEC de ${year}; proposições de outros anos e votações ainda sem cobertura completa.`}}
   if(await writeChanged(new URL(month+'.json',dataRoot),d)){contentChanged=true;console.log(`Updated ${month}: ${d.events.length} events`)}
   if(!index.months.some(m=>m.month===month))index.months.push({month,status:'partial'});
 }
 index.months.sort((a,b)=>a.month.localeCompare(b.month));for(const m of index.months){const d=JSON.parse(await fs.readFile(new URL(m.month+'.json',dataRoot),'utf8'));if(d.events.length)m.status='partial'}
 const updatedAt=contentChanged?collectedAt:(index.sources?.senado?.lastUpdated||collectedAt);
 index.collectionStatus='partial';index.lastUpdated=[index.lastUpdated,updatedAt].filter(Boolean).sort().at(-1);
 index.sources={...index.sources,senado:{status:'partial',year,types,requestedPeriod:{from,to},processesConsulted:processes.size,proposalsWithRecords:normalized.length,errors:errors.length,lastUpdated:updatedAt,notes:'PLPs e PECs identificadas em 2026. Histórico de informes no período solicitado; anos anteriores, resultados e votos nominais não têm cobertura completa.'},camara:index.sources?.camara||{status:'not_started'}};
 const all=[],unique=new Set(),uniqueEvents=new Set();for(const m of index.months){const d=JSON.parse(await fs.readFile(new URL(m.month+'.json',dataRoot),'utf8'));all.push(...d.events.map(e=>e.date));d.proposals.filter(p=>p.house==='Senado').forEach(p=>unique.add(p.officialMatterId));d.events.filter(e=>e.id.startsWith('senado-')).forEach(e=>uniqueEvents.add(e.id))}all.sort();index.availableRecordPeriod=all.length?{from:all[0],to:all.at(-1)}:null;index.totals={...index.totals,senado:{proposals:unique.size,events:uniqueEvents.size}};
 // coveredPeriod means complete cross-House coverage, which this run does not claim.
 await writeChanged(new URL('index.json',dataRoot),index);
 await writeChanged(new URL('raw/senado/latest.json',root),{from,to,year,processes:processes.size,normalized:normalized.length,errors});
 console.log(JSON.stringify({house:'Senado',processes:processes.size,proposals:normalized.length,events:normalized.reduce((n,p)=>n+p.events.length,0),errors:errors.length}));
 if(errors.length)throw Error('Coleta do Senado com falhas; registros anteriores preservados.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await collectSenado();
