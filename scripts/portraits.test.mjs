import test from 'node:test';
import assert from 'node:assert/strict';
import {officialImage} from './collect-portraits.mjs';
test('only official portraits are accepted and mixed content is upgraded',()=>{assert.equal(officialImage('http://www.senado.leg.br/senadores/test.jpg'),'https://www.senado.leg.br/senadores/test.jpg');assert.equal(officialImage('https://senado.leg.br.example.org/test.jpg'),null);assert.equal(officialImage('javascript:alert(1)'),null)});
