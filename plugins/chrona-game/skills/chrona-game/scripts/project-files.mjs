import {readdir,readFile,lstat,mkdir,writeFile,rename,rm,rmdir} from 'node:fs/promises'
import {resolve,dirname,relative} from 'node:path'
import {randomUUID} from 'node:crypto'
import {emptyProject,validateProject,projectPath,textPath,digest,projectDiff,PROJECT_LIMITS} from './project-contract.mjs'

const excluded=new Set(['.git','.chrona','node_modules','dist','build','artifacts','coverage','test-results','playwright-report','.DS_Store','__pycache__','.cache','.vite'])
const privateFile=/^(?:\.env(?:\..*)?|\.npmrc|\.yarnrc(?:\.yml)?|\.aws|\.ssh|credentials(?:\.json)?|auth\.json)$/i
export async function safeMetadata(root){for(const path of [root,resolve(root,'.chrona')]){try{const s=await lstat(path);if(s.isSymbolicLink()||!s.isDirectory())throw new Error('Project and .chrona must be real directories')}catch(e){if(e.code!=='ENOENT')throw e}}}
export async function collectProject(directory,delivery={mode:'static',entry:'index.html'}){
  await safeMetadata(resolve(directory))
  const project=emptyProject(),blobs=new Map();project.delivery=delivery
  async function walk(dir,prefix=''){
    for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
      const path=prefix+entry.name;if(excluded.has(entry.name)||privateFile.test(entry.name))continue
      if(!projectPath(path))throw new Error('Unsupported project path: '+path)
      if(entry.isSymbolicLink())throw new Error('Symbolic links are not project files: '+path)
      if(entry.isDirectory()){await walk(resolve(dir,entry.name),path+'/');continue}
      if(!entry.isFile())throw new Error('Unsupported project file: '+path)
      const full=resolve(dir,entry.name),size=(await lstat(full)).size
      if(size>PROJECT_LIMITS.assetBytes)throw new Error('File size limit exceeded: '+path)
      const bytes=await readFile(full)
      if(textPath(path))project.files[path]=new TextDecoder('utf-8',{fatal:true}).decode(bytes)
      else {const sha256=digest(bytes);project.assets[path]={sha256,bytes:bytes.length,mime:'application/octet-stream'};blobs.set(sha256,full)}
    }
  }
  await walk(resolve(directory));validateProject(project);return {project,blobs}
}
export async function collectBuild(directory,entry='index.html'){
  const files={},blobs=new Map();let total=0
  async function walk(dir,prefix=''){for(const e of await readdir(dir,{withFileTypes:true})){
    const path=prefix+e.name;if(!projectPath(path)||e.isSymbolicLink())throw new Error('Unsafe build path: '+path)
    if(e.isDirectory()){await walk(resolve(dir,e.name),path+'/');continue}
    if(!e.isFile())throw new Error('Unsupported build file: '+path)
    const full=resolve(dir,e.name),size=(await lstat(full)).size;total+=size
    if(total>PROJECT_LIMITS.assetBytes||Object.keys(files).length>=PROJECT_LIMITS.assets)throw new Error('Build size limit exceeded')
    const bytes=await readFile(full),sha256=digest(bytes);files[path]={sha256,bytes:size};blobs.set(sha256,full)
  }}
  await walk(resolve(directory));if(!files[entry])throw new Error('HTML entry not found: '+entry)
  const html=await readFile(resolve(directory,entry),'utf8')
  if(/(?:src|href)\s*=\s*["']\/(?!\/)/i.test(html))throw new Error('Build needs relative asset URLs. For Vite, rebuild with --base=./. Source files do not need to change.')
  return {files,blobs}
}
export async function atomicJson(path,value){await mkdir(dirname(path),{recursive:true});const tmp=path+'.'+randomUUID()+'.tmp';await writeFile(tmp,JSON.stringify(value,null,2)+'\n',{mode:0o600});await rename(tmp,path)}
export async function readJson(path,fallback){try{return JSON.parse(await readFile(path,'utf8'))}catch(e){if(e.code==='ENOENT'&&fallback!==undefined)return fallback;throw e}}
export function isClean(a,b){const d=projectDiff(a,b);return !d.files.length&&!d.assets.length&&!d.delivery}
export async function materialize(directory,project,{before=emptyProject(),fetchAsset}={}){
  validateProject(project);const root=resolve(directory),paths=[...Object.keys(project.files),...Object.keys(project.assets)]
  await safeMetadata(root)
  // Validate all ancestor paths before touching any file. Never follow symlinks.
  for(const path of new Set([...paths,...Object.keys(before.files),...Object.keys(before.assets)])){
    const parts=path.split('/');let full=root
    for(const part of parts){full=resolve(full,part);try{const st=await lstat(full);if(st.isSymbolicLink())throw new Error('Refusing to overwrite a symbolic link: '+relative(root,full))}catch(e){if(e.code!=='ENOENT')throw e}}
  }
  const staged=resolve(root,'.chrona','checkout-'+randomUUID());await mkdir(staged,{recursive:true})
  try{
    for(const [path,text]of Object.entries(project.files)){await mkdir(dirname(resolve(staged,path)),{recursive:true});await writeFile(resolve(staged,path),text)}
    for(const [path,item]of Object.entries(project.assets)){let bytes;if(before.assets[path]?.sha256===item.sha256){try{const saved=await readFile(resolve(root,path));if(saved.length===item.bytes&&digest(saved)===item.sha256)bytes=saved}catch(e){if(e.code!=='ENOENT')throw e}}bytes||=await fetchAsset(item.sha256);if(bytes.length!==item.bytes||digest(bytes)!==item.sha256)throw new Error('Asset checksum failed: '+path);await mkdir(dirname(resolve(staged,path)),{recursive:true});await writeFile(resolve(staged,path),bytes)}
    // The complete checked snapshot remains available if a local disk write fails.
    await atomicJson(resolve(root,'.chrona','checkout-journal.json'),{before,project,staged})
    const removed=[...Object.keys(before.files),...Object.keys(before.assets)].filter(p=>!paths.includes(p)).sort((a,b)=>b.length-a.length)
    for(const path of removed){await rm(resolve(root,path),{force:true});let dir=dirname(resolve(root,path));while(dir!==root){try{await rmdir(dir)}catch{break}dir=dirname(dir)}}
    for(const path of paths){const dest=resolve(root,path);await mkdir(dirname(dest),{recursive:true});await rename(resolve(staged,path),dest)}
    await rm(resolve(root,'.chrona','checkout-journal.json'),{force:true});await rm(staged,{recursive:true,force:true})
  }catch(error){error.message+='; original snapshot and checkout journal are in .chrona';throw error}
}
