import * as THREE from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import {ready,reportError,report,select,asset,save,onInit} from 'chrona'
import configuration from './scene.json'
import gameplay from './gameplay.js'
const canvas=document.getElementById('game'),renderer=new THREE.WebGLRenderer({canvas,antialias:true}),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(60,1,.1,1000),entities=new Map()
scene.background=new THREE.Color(configuration.settings.background||'#182234');scene.add(new THREE.HemisphereLight(0xffffff,0x445577,2));camera.position.set(5,4,7);camera.lookAt(0,0,0)
try{
 for(const e of configuration.entities){let object;if(e.type==='glb')object=(await new GLTFLoader().loadAsync(asset(e.asset))).scene;else object=new THREE.Mesh(e.type==='sphere'?new THREE.SphereGeometry(.5,24,16):new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({color:e.color||'#ffffff'}));object.position.set(...e.position);object.scale.setScalar(e.scale||1);object.name=e.name;object.userData.entityId=e.id;entities.set(e.id,object);scene.add(object)}
 const behavior=gameplay({THREE,scene,camera,entities,settings:configuration.settings,asset,report,save,onInit})||{}
 const resize=()=>{renderer.setSize(innerWidth,innerHeight,false);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()};resize();addEventListener('resize',resize)
 const ray=new THREE.Raycaster(),pointer=new THREE.Vector2();canvas.addEventListener('click',event=>{if(!event.altKey)return;pointer.set(event.clientX/innerWidth*2-1,1-event.clientY/innerHeight*2);ray.setFromCamera(pointer,camera);const hit=ray.intersectObjects([...entities.values()],true)[0];if(!hit)return;let o=hit.object;while(o&&!o.userData.entityId)o=o.parent;select({coordinateSystem:'cartesian',objectId:o?.userData.entityId,name:o?.name||'Location',position:hit.point.toArray(),camera:camera.position.toArray()})})
 let raf,last=performance.now();const frame=time=>{try{const dt=Math.min((time-last)/1000,.1);last=time;behavior.update?.(dt,time/1000);renderer.render(scene,camera);raf=requestAnimationFrame(frame)}catch(error){reportError(error)}};raf=requestAnimationFrame(frame)
 addEventListener('pagehide',()=>{cancelAnimationFrame(raf);behavior.dispose?.();renderer.dispose()},{once:true});document.getElementById('status').textContent='Your Chrona game · Alt-click to select';ready()
}catch(error){reportError(error);document.getElementById('status').textContent=error.message}
