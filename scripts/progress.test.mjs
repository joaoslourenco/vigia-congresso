import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeProgress} from './collect-progress.mjs';
test('devolução sem manifestação não atribui responsabilidade atual ao último relator',()=>{
 const p=normalizeProgress({statusProposicao:{descricaoSituacao:'Aguardando Designação de Relator(a)',siglaOrgao:'CDE',uriUltimoRelator:'anterior',despacho:'Devolvida pelo Relator sem Manifestação.'}},'Câmara','consulta');
 assert.equal(p.awaitingRapporteur,true);assert.equal(p.body,'CDE');assert.equal(p.lastRapporteur,undefined);assert.match(p.lastAction,/Devolvida/);
});
test('Senado usa o colegiado de controle atual, não o destino de um despacho futuro',()=>{
 const p=normalizeProgress({situacaoAtual:'AGUARDANDO PARECER',autuacoes:[{nomeColegiadoControleAtual:'Comissão de Assuntos Sociais',siglaColegiadoControleAtual:'CAS',informesLegislativos:[{data:'2026-01-02',descricao:'Recente'},{data:'2026-01-01',descricao:'Anterior'}]}]},'Senado','consulta');
 assert.equal(p.body,'Comissão de Assuntos Sociais (CAS)');assert.equal(p.lastAction,'Recente');
});
