const assert=require('node:assert/strict');
const Journey=require('../first-group-journey.js');

assert.equal(Journey.nextDirection([]),'charm');
assert.equal(Journey.nextDirection(['charm']),'visual');
assert.equal(Journey.nextDirection(['charm','visual']),'dance');
assert.equal(Journey.resultStep({readyCount:1,groupCount:0}),'nextMember');
assert.equal(Journey.resultStep({readyCount:3,groupCount:0}),'firstLineup');
assert.equal(Journey.resultStep({readyCount:3,groupCount:1}),'established');

assert.equal(Journey.debutReadiness({memberCount:3,roles:['leader','center','dancer'],averageRolePower:180,synergyPct:3}).pass,true);
assert.deepEqual(Journey.debutReadiness({memberCount:3,roles:['leader','dancer','vocal'],averageRolePower:180,synergyPct:0}).missing,['front','synergy']);
assert.deepEqual(Journey.debutReadiness({memberCount:2,roles:['leader','center'],averageRolePower:80,synergyPct:3}).missing,['members','stage','power']);

console.log('first group journey: OK');
