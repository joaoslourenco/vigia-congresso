import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import {pathToFileURL} from 'node:url';
const root=new URL('../',import.meta.url);
export const sourceHash=p=>crypto.createHash('sha256').update(p.officialSummary||'').digest('hex');
const glossary=[
 [/\bMEI\b/i,'MEI é o regime simplificado de formalização do microempreendedor individual.'],
 [/contingenciamento/i,'Contingenciamento é o bloqueio temporário de despesas previstas no orçamento.'],
 [/precat[óo]rios/i,'Precatórios são dívidas do poder público cujo pagamento foi determinado pela Justiça.'],
 [/imunidade/i,'Imunidade tributária é uma proteção prevista na Constituição que impede a cobrança de determinados tributos nas situações abrangidas por ela.'],
 [/d[ée]ficit atuarial/i,'Déficit atuarial é a diferença estimada entre os recursos de um regime de previdência e o valor necessário para pagar seus compromissos futuros.'],
 [/maioridade penal/i,'Maioridade penal é a idade a partir da qual uma pessoa passa a responder criminalmente pelas regras aplicáveis aos adultos.'],
 [/ineleg[íi]ve|inelegibilidade/i,'Inelegibilidade é o impedimento legal para uma pessoa disputar eleições.'],
 [/al[íi]quota/i,'Alíquota é o percentual usado no cálculo de um tributo.'],
 [/diferimento/i,'Diferimento é o adiamento do momento de pagar um tributo, conforme as condições previstas no texto.'],
 [/resultado prim[áa]rio/i,'Resultado primário é a diferença entre receitas e despesas do governo, sem considerar os juros da dívida.'],
 [/transfer[êe]ncias volunt[áa]rias/i,'Transferências voluntárias são repasses de recursos entre entes públicos que não decorrem de uma obrigação constitucional ou legal.'],
 [/\bCBS\b/,'CBS é a Contribuição sobre Bens e Serviços, um dos tributos da reforma do consumo.'],
 [/\bIBS\b/,'IBS é o Imposto sobre Bens e Serviços, previsto na reforma do consumo.']
];
export function simplifyOfficial(text){
 const clean=String(text||'').replace(/\s+/g,' ').trim();
 if(!clean)return 'O resumo desta proposta ainda não está disponível na coleta. O texto pode ser consultado na fonte oficial.';
 let purpose=clean;
 if(/^(Altera|Dá nova redação|Acrescenta|Acresce)/i.test(clean)&&/\bpara\b/i.test(clean))purpose='A proposta busca '+clean.slice(clean.search(/\bpara\b/i)+4).trim();
 else purpose='A proposta '+clean.charAt(0).toLowerCase()+clean.slice(1);
 purpose=purpose.replace(/\s*\(Lei Complementar[^)]*\)/g,'').replace(/,?\s*com base no art\.[\s\S]*$/i,'.');
 if(!/[.!?]$/.test(purpose))purpose+='.';
 return [purpose,...glossary.filter(([r])=>r.test(purpose)).map(([,s])=>s).slice(0,3)].join(' ');
}
export async function summarize(){
 const data=new URL('dist/data/',root),index=JSON.parse(await fs.readFile(new URL('index.json',data),'utf8'));
 const editorial=JSON.parse(await fs.readFile(new URL('content/summaries.json',root),'utf8'));
 let changed=0;
 for(const m of index.months){const file=new URL(m.month+'.json',data),original=await fs.readFile(file,'utf8'),d=JSON.parse(original);
   for(const p of d.proposals){const hash=sourceHash(p),saved=editorial[p.id];
     if(saved&&saved.sourceHash===hash){p.summary=saved.text;p.summaryMethod='editorial';p.aiSummary=true;p.summaryLabel='Resumo elaborado com auxílio de IA';}
     else {p.summary=simplifyOfficial(p.officialSummary);p.summaryMethod='rules';p.aiSummary=false;p.summaryLabel='Texto oficial simplificado automaticamente';}
     p.summarySourceHash=hash;
   }
   const next=JSON.stringify(d,null,2)+'\n';if(next!==original){await fs.writeFile(file,next);changed++}
 }
 console.log(`Resumos preparados; ${changed} arquivo(s) alterado(s).`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await summarize();
