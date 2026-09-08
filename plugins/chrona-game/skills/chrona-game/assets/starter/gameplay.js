export default function gameplay({entities,report,save,onInit}) {
 let seconds=0,lastSave=0
 const unsubscribe=onInit(progress=>{seconds=Number(progress?.seconds)||0;report('World initialized')})
 return {update(dt){seconds+=dt;for(const object of entities.values())object.rotation.y+=dt*.3;if(seconds-lastSave>10){save({version:1,seconds});lastSave=seconds}},dispose:unsubscribe}
}
