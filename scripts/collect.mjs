// Daily public-source collection. Keep earlier records if a source is unavailable.
const errors=[];
for(const [name,file,fn] of [['Câmara','./collect-camara.mjs','collectCamara'],['Senado','./collect-senado.mjs','collectSenado']]){
 try{await (await import(file))[fn]()}catch(e){console.error(name+': '+e.message);errors.push(name)}
}
try{await (await import('./collect-portraits.mjs')).collectPortraits()}catch{console.error('Fotos indisponíveis nesta consulta; retratos anteriores preservados.')}
if(errors.length)process.exitCode=1;
