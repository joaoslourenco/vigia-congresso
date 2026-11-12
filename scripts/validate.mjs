import fs from 'node:fs/promises';
const root=new URL('../dist/data/',import.meta.url),index=JSON.parse(await fs.readFile(new URL('index.json',root)));
for(const {month} of index.months){const d=JSON.parse(await fs.readFile(new URL(month+'.json',root)));if(d.month!==month)throw Error('Month mismatch');for(const collection of ['proposals','events']){if(!Array.isArray(d[collection]))throw Error('Invalid collection');const ids=d[collection].map(x=>x.id);if(ids.some(x=>!x)||new Set(ids).size!==ids.length)throw Error('Missing or duplicate ID')}
 for(const p of d.proposals){const url=new URL(p.source);if(!['camara.leg.br','senado.leg.br'].some(h=>url.hostname===h||url.hostname.endsWith('.'+h)))throw Error('Unofficial source');if(!['PLP','PEC'].includes(p.type))throw Error('Invalid proposal type')}
 for(const e of d.events){if(!d.proposals.some(p=>p.id===e.proposalId)||!e.date?.startsWith(month)||!e.collectedAt)throw Error('Invalid event');if(e.vote?.nominalOfficial&&!e.vote.source)throw Error('Nominal voting requires official source')}
 for(const [date,c] of Object.entries(d.days)){if(c.status==='complete'&&(!c.sources?.camara||!c.sources?.senado))throw Error('Complete day requires both official sources')}}
console.log('Monthly data validation passed.');
