import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProcess} from './collect-senado.mjs';
test('official signature order is not inferred as principal authorship; original affiliation and conflict are preserved',()=>{
 const p={id:123,codigoMateria:456,sigla:'PEC',numero:'1',ano:2026,documento:{dataApresentacao:'2026-11-02',resumoAutoria:'Senadora Nome de teste (AAA/SP)',autoria:[{autor:'Nome de teste',codigoParlamentar:99,ordem:1,siglaTipo:'SENADOR',siglaPartido:'BBB',uf:'SP'}]},autuacoes:[{informesLegislativos:[{id:789,data:'2026-11-02 12:00:00',descricao:'Texto oficial'},{id:789,data:'2026-11-02 12:00:00',descricao:'Texto oficial'},{id:790,data:'2026-10-01 12:00:00',descricao:'Fora da janela'}]}]};
 const {proposal,events}=normalizeProcess(p,'2026-11-11T15:00:00Z','2026-11-01','2026-11-11');
 assert.equal(proposal.authors[0].role,'autoria conjunta');assert.equal(proposal.authors[0].party,'AAA');assert.equal(proposal.conflict,true);assert.equal(events.length,1);assert.equal(events[0].id,'senado-informe-789');assert.equal(events[0].date,'2026-11-02');assert.equal(events[0].collectedAt,'2026-11-11T15:00:00Z');assert.equal(events[0].vote,null);assert.equal(proposal.history.length,1);
});
