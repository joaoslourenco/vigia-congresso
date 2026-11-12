import fs from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
// Keep earlier snapshots immutable. Existing plain snapshots do not get duplicated.
export async function storeSnapshot(directory,id,value){
 if(!/^[a-f0-9]{64}$/.test(id))throw Error('Identificador de snapshot inválido');
 await fs.mkdir(directory,{recursive:true});
 for(const name of [id+'.json',id+'.json.gz'])try{await fs.access(new URL(name,directory));return false}catch{}
 try{await fs.writeFile(new URL(id+'.json.gz',directory),gzipSync(Buffer.from(JSON.stringify(value))),{flag:'wx'});return true}catch(e){if(e.code==='EEXIST')return false;throw e}
}
