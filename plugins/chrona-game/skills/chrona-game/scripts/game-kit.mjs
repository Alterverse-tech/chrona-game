#!/usr/bin/env node
import {readFile,writeFile,mkdir,readdir,cp} from 'node:fs/promises'
import {resolve,dirname,relative} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createHash} from 'node:crypto'
import {FORMAT,LIMITS,safePath,sourcePath,assetMime,validateSources,manifestFor} from './contract.mjs'
const root=resolve(process.argv[3]||'.'),command=process.argv[2],skill=resolve(dirname(fileURLToPath(import.meta.url)),'..')
async function pack(){const files={},assets={};let assetBytes=0
 async function walk(dir){for(const e of await readdir(dir,{withFileTypes:true})){if(e.name.startsWith('.')||['node_modules','dist','build'].includes(e.name)||e.name.endsWith('.chrona-game.json'))continue;const abs=resolve(dir,e.name),p=relative(root,abs).replaceAll('\\','/');if(e.isSymbolicLink())throw new Error('Symbolic links are not packaged: '+p);if(e.isDirectory())await walk(abs);else if(e.isFile()){
  if(p==='package.json'||p==='package-lock.json')continue
  if(p.startsWith('assets/')){if(!safePath(p)||!assetMime(p))throw new Error('Unsupported asset: '+p);const bytes=await readFile(abs);assetBytes+=bytes.length;if(assetBytes>LIMITS.assetBytes)throw new Error('Asset size limit exceeded');assets[p]={sha256:createHash('sha256').update(bytes).digest('hex'),base64:bytes.toString('base64')}}
  else if(sourcePath(p))files[p]=await readFile(abs,'utf8')
 }} }
 await walk(root);if(!files['chrona.game.json'])throw new Error('Missing chrona.game.json');const m=manifestFor(files);validateSources(files,m)
 if(Object.keys(assets).length>LIMITS.assets)throw new Error('Too many assets')
 return {format:FORMAT,files,assets}
}
async function previewGame(){
 const pkg=await pack(),manifest=manifestFor(pkg.files),port=Number(process.env.PORT||8150)
 let build;try{({build}=await import(new URL('file://'+resolve(root,'node_modules/esbuild/lib/main.js'))))}catch{throw new Error('Preview needs local dependencies. In the game directory run: npm install --no-save esbuild three@0.170.0 @dimforge/rapier3d-compat@0.20.0')}
 const {createServer}=await import('node:http'),mime={'.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.json':'application/json','.mp3':'audio/mpeg','.ogg':'audio/ogg','.mp4':'video/mp4'}
 const {extname}=await import('node:path')
 const {pathToFileURL}=await import('node:url')
 const server=createServer(async(req,res)=>{try{
  const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
  if(path==='/'){
   const current=await pack(),m=manifestFor(current.files),result=await build({absWorkingDir:root,entryPoints:[m.entry],bundle:true,write:false,format:'esm',platform:'browser',alias:{chrona:resolve(skill,'scripts/sdk.js')},logLevel:'silent'})
   const context={sceneId:'standalone',preview:true,assets:Object.fromEntries(Object.keys(current.assets).map(p=>[p,'/'+p]))}
   const css=m.styles.map(p=>current.files[p]).join('\n').replace(/asset:([a-zA-Z0-9_./-]+)/g,'/$1'),body=current.files[m.html].match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]?.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(`<!doctype html><html lang="en"><head><style>${css}</style><script>globalThis.__CHRONA_CONTEXT__=${JSON.stringify(context).replace(/</g,'\\u003c')}</script></head><body>${body}<script type="module">${result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')}</script></body></html>`)
  }else{const p=path.slice(1);if(!safePath(p)||!p.startsWith('assets/')||!assetMime(p))throw new Error('Asset not found');const bytes=await readFile(resolve(root,p));res.writeHead(200,{'Content-Type':assetMime(p)});res.end(bytes)}
 }catch(error){res.writeHead(400,{'Content-Type':'text/plain'});res.end(error.message)}})
 server.listen(port,'127.0.0.1',()=>console.log(`Game preview: http://127.0.0.1:${port} (refresh after source edits)`))
}
try{
 if(command==='init'){
  await mkdir(root,{recursive:true});if((await readdir(root)).length)throw new Error('Choose an empty game directory')
  await cp(resolve(skill,'assets/starter'),root,{recursive:true});console.log('Created Chrona game project: '+root)
 }else if(command==='preview'){await previewGame()}else if(command==='check'||command==='pack'){
  const pkg=await pack();if(command==='pack'){const out=resolve(process.argv[4]||resolve(root,'game.chrona-game.json'));await writeFile(out,JSON.stringify(pkg));console.log(out)}else console.log(`Package valid: ${Object.keys(pkg.files).length} source files, ${Object.keys(pkg.assets).length} assets. Build and play checks are separate.`)
 }else throw new Error('Usage: node game-kit.mjs init|check|pack|preview <game-directory> [output.chrona-game.json]')
}catch(error){console.error(error.message);process.exitCode=1}
