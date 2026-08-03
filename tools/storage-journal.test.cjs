const assert=require('node:assert/strict');
const Journal=require('../storage-journal.js');

function memoryStorage(){
  const data=new Map();
  return {
    getItem:key=>data.has(key)?data.get(key):null,
    setItem:(key,value)=>data.set(key,String(value)),
    removeItem:key=>data.delete(key),
  };
}

const storage=memoryStorage();
const valid=value=>Number.isInteger(value.turn)&&value.turn>0;
Journal.write(storage,'save','backup',{turn:1},valid);
assert.deepEqual(Journal.read(storage,'save','backup',valid),{value:{turn:1},recovered:false,source:'primary'});
assert.equal(storage.getItem('backup'),null);

Journal.write(storage,'save','backup',{turn:2},valid);
assert.deepEqual(JSON.parse(storage.getItem('backup')),{turn:1});

storage.setItem('save','{"turn":');
assert.deepEqual(Journal.read(storage,'save','backup',valid),{value:{turn:1},recovered:true,source:'backup'});
assert.deepEqual(JSON.parse(storage.getItem('save')),{turn:1});

storage.setItem('save','broken');
storage.setItem('backup','also broken');
assert.deepEqual(Journal.read(storage,'save','backup',valid),{value:null,recovered:false,source:'none'});

storage.setItem('save','{"turn":0}');
storage.setItem('backup','{"turn":3}');
assert.deepEqual(Journal.read(storage,'save','backup',valid),{value:{turn:3},recovered:true,source:'backup'});

Journal.clear(storage,'save','backup');
assert.equal(storage.getItem('save'),null);
assert.equal(storage.getItem('backup'),null);
console.log('storage journal: OK');
