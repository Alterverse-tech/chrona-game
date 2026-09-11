#!/usr/bin/env node
import {readFile,readdir,mkdir,rm} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {homedir,hostname} from 'node:os'
import {randomBytes,randomUUID} from 'node:crypto'
import {spawn} from 'node:child_process'
import {fileURLToPath} from 'node:url'
import {digest,emptyProject,projectDiff,validateProject} from './project-contract.mjs'
import {collectProject,collectBuild,atomicJson,readJson,isClean,materialize,safeMetadata} from './project-files.mjs'

export const DEFAULT_SITE='https://chrona-world.3-239-35-193.sslip.io'
const output=value=>console.log(JSON.stringify(value,null,2))
const wait=ms=>new Promise(r=>setTimeout(r,ms))
export function browserCommand(url,platform=process.platform){
  return platform==='darwin'?['open',['-u',url]]:platform==='win32'?['rundll32.exe',['url.dll,FileProtocolHandler',url]]:['xdg-open',[url]]
}
export function openAuthorization(url,{platform=process.platform,spawnImpl=spawn}={}){
  return new Promise(resolve=>{
    const [command,args]=browserCommand(url,platform)
    try{const child=spawnImpl(command,args,{stdio:'ignore',shell:false});child.once('error',()=>resolve(false));child.once('close',code=>resolve(code===0))}catch{resolve(false)}
  })
}
export function options(args){const out={_:[]};for(let i=0;i<args.length;i++){if(args[i].startsWith('--')){const key=args[i].slice(2);out[key]=args[i+1]&&!args[i+1].startsWith('--')?args[++i]:true}else out._.push(args[i])}return out}
function siteUrl(value){const u=new URL(value),worldsPage=u.pathname==='/worlds.html';if(u.username||u.password||(!worldsPage&&(u.pathname!=='/'||u.search||u.hash))||!(u.protocol==='https:'||u.protocol==='http:'&&['localhost','127.0.0.1'].includes(u.hostname)))throw new Error('Use an HTTPS Chrona origin or a /worlds.html page');return u.origin}
export function worldTarget(value,site){
  if(value===undefined)return {site}
  if(typeof value!=='string')throw new Error('--world needs a World ID or link')
  const uuid=/^[a-f0-9-]{36}$/i
  if(uuid.test(value))return {world:value.toLowerCase(),site}
  let url;try{url=new URL(value)}catch{throw new Error('Use a World ID or Chrona World link')}
  if(url.username||url.password)throw new Error('World links cannot contain credentials')
  const origin=siteUrl(url.origin),match=url.pathname.match(/^\/play\/([a-f0-9-]{36})\/?$/i)
  const id=match?.[1]||(/^\/studio(?:\/(?:collaboration|history))?\/$/.test(url.pathname)?url.searchParams.get('world'):null)
  if(!id||!uuid.test(id))throw new Error('The link must identify a Chrona World')
  if(site&&siteUrl(site)!==origin)throw new Error('World link and --site identify different Chrona sites')
  return {world:id.toLowerCase(),site:origin}
}
export class ChronaClient {
  constructor(site,token){this.site=siteUrl(site);this.token=token}
  async request(path,data,{binary=false}={}){
    const r=await fetch(this.site+path,{method:data===undefined?'GET':'POST',headers:{...(this.token?{Authorization:'Bearer '+this.token}:{}),...(data!==undefined?{'Content-Type':'application/json'}:{})},body:data===undefined?undefined:JSON.stringify(data),redirect:'error',signal:AbortSignal.timeout(120000)})
    if(binary&&r.ok)return Buffer.from(await r.arrayBuffer())
    const value=await r.json();if(!r.ok){const e=new Error(value.error||'Chrona request failed');e.status=r.status;e.details=value.details;throw e}return value
  }
}
async function runBuild(root,script){if(!/^[a-zA-Z0-9:_-]+$/.test(script))throw new Error('Invalid npm script name');await new Promise((ok,fail)=>{const p=spawn(process.platform==='win32'?'npm.cmd':'npm',['run',script],{cwd:root,stdio:'inherit',shell:false});p.on('error',fail);p.on('close',code=>code===0?ok():fail(new Error('Local build failed')))})}
export async function main(args=process.argv.slice(2)){
  const [command='help',...rest]=args,o=options(rest),root=resolve(o.dir||'.'),config=resolve(process.env.CHRONA_CONFIG_DIR||join(homedir(),'.config','chrona')),authPath=resolve(config,'clients.json'),statePath=resolve(root,'.chrona','workspace.json')
  Object.assign(o,worldTarget(o.world,o.site))
  if(command==='help'){console.log(`Chrona project CLI (Node.js 20+)\nlogin --site ORIGIN [--world ID_OR_LINK] [--publish] [--read-only] [--remember] [--force]\ncreate --name NAME --dir PROJECT\ncheckout --world ID_OR_LINK --dir EMPTY_DIRECTORY [--read-only]\nconfigure --delivery metadata.json\nstatus | diff | push [--summary TEXT]\nbranch [--name TEXT] | pull | rebase [--resolve resolutions.json]\npreview [--build] [--script build] [--dist dist]\nsubmit [--title TEXT]\nreview --submission ID [--reject] | merge --submission ID | publish\nrestore --commit SHA\nDefault site: ${DEFAULT_SITE}\nUse --site ORIGIN to select a login. A /worlds.html URL is normalized to its origin. Credentials stay outside the project.`);return}
  let credentials=await readJson(authPath,{clients:[]})
  if(command==='login'){
    const site=siteUrl(o.site||DEFAULT_SITE),verifier=randomBytes(32).toString('hex'),client=new ChronaClient(site),worldId=o.world||null
    if(o.remember&&worldId)throw new Error('--remember is for creating new Worlds; use a World-scoped login to join a World')
    const scopes=['read',...(o['read-only']?[]:['write']),...(o.publish?['publish']:[])]
    const saved=credentials.clients.findLast(c=>c.site===site&&(c.worldId===worldId||worldId&&c.remember)&&(!o.remember||c.remember)&&scopes.every(s=>c.scopes?.includes(s))&&(c.remember&&c.expiresAt===null||c.expiresAt>Date.now()))
    if(saved&&!o.force){try{const existing=new ChronaClient(site,saved.token);await existing.request('/api/collaboration/auth/session');if(worldId)await existing.request(`/api/worlds/${worldId}/collaboration`);console.log('Already connected. Continue in your creation tool.');output({authorized:true,site,worldId,reused:true});return}catch(error){if(![401,403].includes(error.status))throw error}}
    const auth=await client.request('/api/collaboration/auth/start',{worldId,remember:!!o.remember,challenge:digest(verifier),scopes,clientName:o.client||'Chrona CLI',deviceName:hostname()})
    const approvalUrl=new URL(auth.verificationPath,site)
    if(approvalUrl.origin!==site||approvalUrl.username||approvalUrl.password||approvalUrl.hash||approvalUrl.pathname!=='/studio/connect/'||!/^[A-F0-9]{10}$/.test(auth.userCode)||approvalUrl.searchParams.get('code')!==auth.userCode)throw new Error('Chrona returned an invalid authorization link')
    console.log('Open '+approvalUrl.href+' and approve code '+auth.userCode+'.')
    console.log(o.remember?'Choose Connect in your browser. This CLI will receive it automatically; no copying is needed.':'Choose Create token in your browser. This CLI will receive it automatically; no copying is needed.')
    if(!o['no-browser']){if(!await openAuthorization(approvalUrl.href))console.log('Could not open your browser automatically. Use the link above.')}
    const deadline=Date.now()+auth.expiresIn*1000
    while(Date.now()<deadline){await wait(auth.interval*1000);const result=await client.request('/api/collaboration/auth/poll',{deviceCode:auth.deviceCode,verifier});if(result.status!=='authorized')continue
      credentials=await readJson(authPath,{clients:[]});credentials.clients=credentials.clients.filter(c=>!(c.site===site&&c.worldId===result.worldId));credentials.clients.push({site,...result});await atomicJson(authPath,credentials);if(result.remember){try{await client.request('/api/collaboration/auth/received',{deviceCode:auth.deviceCode,verifier})}catch{console.log('Connection saved. You can close the browser tab manually.')}}console.log('Connected. Your token was saved securely; continue in your creation tool.');output({authorized:true,site,worldId:result.worldId,expiresAt:result.expiresAt});return}
    throw new Error('Authorization expired. Run login again')
  }
  await safeMetadata(root)
  let state=await readJson(statePath,null)
  if(state&&o.world&&o.world!==state.worldId)throw new Error('This directory is bound to another World')
  if(state&&o.site&&siteUrl(o.site)!==state.site)throw new Error('This directory is bound to another Chrona site')
  const worldId=state?.worldId||o.world||null,site=siteUrl(o.site||state?.site||DEFAULT_SITE)
  const valid=c=>c.site===site&&(c.remember&&c.expiresAt===null||c.expiresAt>Date.now())
  const credential=credentials.clients.findLast(c=>valid(c)&&(c.worldId===worldId||command==='create'&&c.worldId===null))||credentials.clients.findLast(c=>valid(c)&&c.remember)
  if(!credential)throw new Error('Run login for '+(worldId||'a new World')+' at '+site+' first')
  const client=new ChronaClient(site,credential.token)
  const route=action=>`/api/worlds/${state.worldId}/collaboration${action?'/'+action:''}`
  const save=()=>atomicJson(statePath,state)
  const call=(action,data)=>client.request(route(action),data)
  const load=async()=>{const p=await call('checkout',{branchId:state.branch.id});state.policyRevision=p.policyRevision;return p}
  const snapshot=async()=>collectProject(root,state.deliveryOverride||state.project.delivery)
  const clean=async()=>{if(!isClean((await snapshot()).project,state.project))throw new Error('Local changes are not pushed. Push them before pulling, branching or integrating.')}
  const apply=async p=>{await materialize(root,p.project,{before:state.project,fetchAsset:sha=>client.request(route('assets/'+sha),undefined,{binary:true})});state.project=p.project;state.branch=p.branch||(state.readOnly?{id:null,head:p.commit,base:p.main,status:'read-only'}:null);state.policyRevision=p.policyRevision;state.pending=null;await save()}
  const mutation=async(action,payload)=>{
    const fingerprint=digest(JSON.stringify({action,payload})),pending=state.pending
    if(pending?.action===action&&pending.result)return pending.result
    if(pending&&pending.fingerprint!==fingerprint)throw new Error('An earlier request has an uncertain result. Retry the same command first: '+pending.action)
    state.pending=pending||{action,fingerprint,requestId:randomUUID()};await save()
    try{const result=await call(action,{...payload,requestId:state.pending.requestId});state.pending.result=result;await save();return result}catch(e){if(e.status){state.pending=null;await save()}throw e}
  }
  async function upload(items,blobs){const unique=[...new Map(Object.values(items).map(i=>[i.sha256,i])).values()];let uploaded=0,bytes=0
    for(let at=0;at<unique.length;at+=1000){const batch=unique.slice(at,at+1000),{missing}=await call('missing-assets',{assets:batch})
      for(const sha256 of missing){const item=batch.find(i=>i.sha256===sha256),data=await readFile(blobs.get(sha256));if(digest(data)!==sha256)throw new Error('Asset changed while uploading')
        const begin=await call('uploads',item);let offset=begin.offset
        while(offset<data.length){const part=data.subarray(offset,offset+begin.chunkBytes);const result=await call(`uploads/${begin.id}/chunk`,{offset,base64:part.toString('base64')});offset=result.offset}
        await call(`uploads/${begin.id}/finish`,{});uploaded++;bytes+=data.length
      }
    }return {uploaded,bytes,reused:unique.length-uploaded}
  }
  if(command==='create'){
    if(state?.worldId&&state?.branch){output({worldId:state.worldId,branch:state.branch.id,alreadyConnected:true,next:'push'});return}
    await collectProject(root)
    const pendingPath=resolve(root,'.chrona','create.json'),creation=await readJson(pendingPath,{requestId:randomUUID(),name:o.name||'My game World',site})
    if(creation.site!==site||creation.name!==(o.name||'My game World'))throw new Error('Retry the pending creation with its original name and site')
    await atomicJson(pendingPath,creation)
    const created=await client.request('/api/collaboration/worlds',creation);state={site,worldId:created.worldId,project:emptyProject()};await save();if(!credential.remember)credential.worldId=created.worldId;await atomicJson(authPath,credentials)
    const status=await call('');state.policyRevision=status.policyRevision
    state.branch=await call('branch',{policyRevision:state.policyRevision,name:'Initial game',client:'Chrona CLI',requestId:creation.requestId});await save();await rm(pendingPath,{force:true})
    output({worldId:state.worldId,branch:state.branch.id,next:'push',url:site+'/studio/collaboration/?world='+state.worldId});return
  }
  if(command==='checkout'||command==='connect'){
    if(state)throw new Error('This directory is already connected. Use pull.')
    await mkdir(root,{recursive:true});if((await readdir(root)).some(n=>n!=='.chrona'))throw new Error('Checkout requires an empty directory')
    state={site,worldId:o.world,readOnly:!!o['read-only'],project:emptyProject()};if(!state.worldId)throw new Error('--world is required')
    const status=await call('');state.policyRevision=status.policyRevision
    state.branch=state.readOnly?{id:null,head:status.main,status:'read-only'}:await call('branch',{policyRevision:state.policyRevision,name:o.name||'Development task',client:o.client||'Chrona CLI',requestId:randomUUID()});await save();await apply(await load());output({worldId:state.worldId,branch:state.branch.id,commit:state.branch.head});return
  }
  if(!state?.branch)throw new Error('Run create or checkout first')
  if(command==='configure'){if(state.pending)throw new Error('Finish the pending request first');const delivery=await readJson(resolve(o.delivery||''));validateProject({...state.project,delivery});state.deliveryOverride=delivery;await save();output({delivery,next:'push'});return}
  if(command==='status'){output({...await call(''),local:{branch:state.branch.id,head:state.branch.head,changes:projectDiff(state.project,(await snapshot()).project),pending:state.pending?.action||null}});return}
  if(command==='diff'){output({local:projectDiff(state.project,(await snapshot()).project),remote:await call('diff',{branchId:state.branch.id})});return}
  if(command==='push'){
    const {project,blobs}=await snapshot(),diff=projectDiff(state.project,project),assetResult=await upload(Object.fromEntries(diff.assets.filter(p=>project.assets[p]).map(p=>[p,project.assets[p]])),blobs)
    const payload={branchId:state.branch.id,expectedHead:state.branch.head,policyRevision:state.policyRevision,summary:o.summary||'Update game project',files:Object.fromEntries(diff.files.map(p=>[p,project.files[p]??null])),assets:Object.fromEntries(diff.assets.map(p=>[p,project.assets[p]??null])),...(diff.delivery?{delivery:project.delivery}:{})}
    const result=await mutation('push',payload);state.branch=result.branch;state.project=(await call('checkout',{commit:result.branch.head})).project;state.pending=null;delete state.deliveryOverride;await save();output({...result,assets:assetResult});return
  }
  if(command==='pull'){await clean();await apply(await load());output({branch:state.branch.id,commit:state.branch.head});return}
  if(command==='branch'){
    await clean();const status=await call('');state.policyRevision=status.policyRevision
    const branch=await mutation('branch',{policyRevision:state.policyRevision,baseCommit:status.main,name:o.name||'Development task',client:o.client||'Chrona CLI'});state.branch=branch;state.pending=null;await save();await apply(await load());output(branch);return
  }
  if(command==='rebase'){
    await clean();const status=await call('');state.policyRevision=status.policyRevision
    let resolved={};if(o.resolve){const saved=await readJson(resolve(root,'.chrona','conflicts.json'));if(saved.main!==status.main||saved.head!==state.branch.head)throw new Error('Conflict versions changed. Run rebase again');resolved={resolutions:await readJson(resolve(o.resolve))}}
    try{const result=await mutation('rebase',{branchId:state.branch.id,expectedHead:state.branch.head,expectedMain:status.main,policyRevision:state.policyRevision,...resolved});await apply({...await load(),branch:result.branch});await rm(resolve(root,'.chrona','conflicts.json'),{force:true});output(result)}catch(e){if(e.details?.conflicts){await atomicJson(resolve(root,'.chrona','conflicts.json'),e.details);console.error('Conflict data saved to .chrona/conflicts.json. Resolve explicitly, then run rebase --resolve resolutions.json (path-to-content map).')}throw e}return
  }
  if(command==='preview'){
    await clean();const pinned=await load();if(pinned.commit!==state.branch.head)throw new Error('Branch changed. Pull first')
    if(state.project.delivery.mode==='v1'){output(await call('build',{branchId:state.branch.id,expectedHead:state.branch.head,policyRevision:state.policyRevision}));return}
    if(o.build)await runBuild(root,o.script||'build')
    await clean();const {files,blobs}=await collectBuild(resolve(root,o.dist||'dist'),state.project.delivery.entry),assets=await upload(files,blobs)
    const result=await call('artifact',{branchId:state.branch.id,expectedHead:state.branch.head,policyRevision:state.policyRevision,files,entry:state.project.delivery.entry});output({...result,assets,url:site+result.previewUrl});return
  }
  const status=await call('');state.policyRevision=status.policyRevision
  if(command==='submit'){await clean();const build=status.builds[state.branch.head];if(!build)throw new Error('Preview this source version first');const submitted=await mutation('submit',{branchId:state.branch.id,expectedHead:state.branch.head,expectedHash:build.hash,policyRevision:state.policyRevision,title:o.title||'Update game'});state.pending=null;await save();output(submitted);return}
  if(command==='review'||command==='merge'){
    const s=status.submissions.find(s=>s.id===o.submission);if(!s)throw new Error('--submission must identify a current submission')
    const payload={submissionId:s.id,expectedHead:s.head,expectedHash:s.build.hash,expectedReviewVersion:s.version,policyRevision:state.policyRevision,expectedMain:status.main}
    const result=command==='review'?await mutation('review',{...payload,action:o.reject?'reject':'approve'}):await mutation('merge',payload);state.pending=null;await save();output(result);return
  }
  if(command==='publish'){const build=status.builds[status.main];if(!build)throw new Error('Main has no build');output(await call('publish',{expectedMain:status.main,expectedHash:build.hash,policyRevision:state.policyRevision}));return}
  if(command==='restore'){await clean();state.branch=await mutation('restore',{commit:o.commit,expectedMain:status.main,policyRevision:state.policyRevision});state.pending=null;await save();await apply(await load());output({branch:state.branch,next:'preview, submit and review this restoration'});return}
  throw new Error('Unknown command. Run chrona.mjs help')
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{console.error(e.message);if(e.details?.code)console.error(e.details.code);process.exitCode=1})
