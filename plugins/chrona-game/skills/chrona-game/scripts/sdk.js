// Browser-only host protocol. The runtime never receives account credentials.
const context = globalThis.__CHRONA_CONTEXT__ || {sceneId:'standalone',assets:{},preview:true}
export const sceneId = context.sceneId
export const preview = !!context.preview
export function asset(path) {
 const url = context.assets[path]
 if (!url) throw new Error('Asset is not packaged: '+path)
 return url
}
export function notify(type, data={}) { if (parent!==window) parent.postMessage({...data,type,sceneId},'*') }
export const report = message => notify('chrona:runtime-log',{message:String(message).slice(0,1000)})
export const ready = () => {notify('chrona:scene-ready');if(parent===window)window.postMessage({type:'chrona:world-init',sceneId,progress:null},'*')}
export const reportError = error => notify('chrona:scene-error',{error:String(error?.message||error).slice(0,1000)})
export const select = selection => notify('chrona:selection',{selection})
export const save = (progress,reset=false) => notify('chrona:progress',{progress,reset})
export function onMessage(fn) {
 const receive=e=>{if(e.source===parent && e.data?.sceneId===sceneId) fn(e.data)}
 addEventListener('message',receive);return()=>removeEventListener('message',receive)
}
export function onInit(fn) { return onMessage(data=>{if(data.type==='chrona:world-init')fn(data.progress,{worldId:data.worldId,preview})}) }
export function cityNetwork() {
 let data={players:[],state:'offline',anchor:{x:0,z:0}}
 onMessage(event=>{if(event.type==='chrona:network')data=event.snapshot})
 return {config:()=>({anchor:data.anchor}),net:{state:()=>data.state,players:()=>data.players,sampleSelf:()=>data.self,sampleRemote:id=>data.players.find(p=>p.id===id)?.sample,sendInput:input=>notify('chrona:network-input',{input})}}
}
