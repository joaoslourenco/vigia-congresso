import test from 'node:test';
import assert from 'node:assert/strict';
import {simplifyOfficial,sourceHash} from './summarize.mjs';
test('simplification explains terms without claiming a proposal has passed',()=>{
 const s=simplifyOfficial('Altera a Lei Complementar nº 101, de 4 de maio de 2000, para vedar o contingenciamento do programa.');
 assert.match(s,/A proposta busca vedar/);assert.match(s,/bloqueio temporário/);assert.doesNotMatch(s,/foi aprovad|já está em vigor/i);
});
test('empty official content does not create policy details',()=>{assert.match(simplifyOfficial(null),/ainda não está disponível/)});
test('source fingerprint changes when official content changes',()=>{assert.notEqual(sourceHash({officialSummary:'a'}),sourceHash({officialSummary:'b'}))});
