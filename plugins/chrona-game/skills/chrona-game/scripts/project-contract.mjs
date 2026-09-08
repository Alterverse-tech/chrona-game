// Shared project transport rules. These do not prescribe a game's implementation.
import {createHash} from 'node:crypto'

export const PROJECT_FORMAT = 'chrona.project/v1'
export const PROJECT_LIMITS = {files:1200, fileBytes:4*1024*1024, sourceBytes:32*1024*1024, assets:1000, assetBytes:512*1024*1024}
export const digest = value => createHash('sha256').update(value).digest('hex')
export const isHash = value => typeof value==='string' && /^[a-f0-9]{64}$/.test(value)
export const isCommit = value => typeof value==='string' && /^[a-f0-9]{40}$/.test(value)
const blocked = /^(?:\.git|\.chrona|\.env(?:\..*)?|\.npmrc|\.yarnrc(?:\.yml)?|\.aws|\.ssh|node_modules|coverage|test-results|playwright-report|__pycache__|credentials(?:\.json)?|auth\.json)$/i
export function projectPath(path) {
  return typeof path==='string' && path.length<=240 && /^[A-Za-z0-9_.@/-]+$/.test(path) && path.split('/').every(part=>part && part!=='.' && part!=='..' && !blocked.test(part) && !['__proto__','constructor','prototype'].includes(part))
}
export function textPath(path) { return /(?:\.(?:[cm]?[jt]sx?|json|html?|css|scss|sass|less|glsl|vert|frag|wgsl|txt|md|ya?ml|toml|xml|csv|svg|lock)|(?:^|\/)(?:LICENSE|Makefile|\.gitignore|\.gitattributes))$/i.test(path) }
export function checkText(path, text) {
  if (!projectPath(path) || typeof text!=='string' || text.includes('\0') || Buffer.byteLength(text)>PROJECT_LIMITS.fileBytes) throw new Error('Invalid project source: '+path)
  if (/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:AKIA[A-Z0-9]{16}|gh[pousr]_[A-Za-z0-9]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{40,})\b/.test(text)) throw new Error('Credential-like material cannot be uploaded: '+path)
}
export function validateProject(project) {
  if (project?.format!==PROJECT_FORMAT || !project.files || !project.assets || typeof project.files!=='object'||typeof project.assets!=='object'||Array.isArray(project.files)||Array.isArray(project.assets)) throw new Error('Invalid project snapshot')
  if (Object.keys(project.files).length>PROJECT_LIMITS.files || Object.keys(project.assets).length>PROJECT_LIMITS.assets) throw new Error('Project has too many files')
  let sourceBytes=0,assetBytes=0
  for (const [path,text] of Object.entries(project.files)) {checkText(path,text); sourceBytes+=Buffer.byteLength(text)}
  for (const [path,item] of Object.entries(project.assets)) {
    if (!projectPath(path)||Object.hasOwn(project.files,path)||!isHash(item?.sha256)||!Number.isSafeInteger(item.bytes)||item.bytes<0) throw new Error('Invalid project asset: '+path)
    assetBytes+=item.bytes
  }
  const paths=new Set([...Object.keys(project.files),...Object.keys(project.assets)])
  if(new Set([...paths].map(p=>p.toLowerCase())).size!==paths.size)throw new Error('Case-insensitive file collision')
  for(const path of paths){const parts=path.split('/');while(parts.length>1){parts.pop();if(paths.has(parts.join('/')))throw new Error('File/directory collision: '+path)}}
  if(sourceBytes>PROJECT_LIMITS.sourceBytes||assetBytes>PROJECT_LIMITS.assetBytes)throw new Error('Project size limit exceeded')
  if(!['static','v1'].includes(project.delivery?.mode))throw new Error('Choose static or v1 delivery')
  const entry=project.delivery.entry||'index.html'
  if(!projectPath(entry)||!entry.endsWith('.html'))throw new Error('Invalid HTML entry')
  if(project.delivery.connectOrigins!==undefined&&(!Array.isArray(project.delivery.connectOrigins)||project.delivery.connectOrigins.length>20||project.delivery.connectOrigins.some(origin=>{try{const u=new URL(origin);return !['https:','wss:'].includes(u.protocol)||u.origin!==origin||!!u.username||!!u.password}catch{return true}})))throw new Error('Provide exact HTTPS or WSS connection origins')
  return project
}
export function emptyProject(){return {format:PROJECT_FORMAT,files:{},assets:{},delivery:{mode:'static',entry:'index.html'}}}
export function changedPaths(before,after){return [...new Set([...Object.keys(before),...Object.keys(after)])].filter(path=>JSON.stringify(before[path])!==JSON.stringify(after[path])).sort()}
export function projectDiff(before,after){return {files:changedPaths(before.files,after.files),assets:changedPaths(before.assets,after.assets),delivery:JSON.stringify(before.delivery)!==JSON.stringify(after.delivery)}}
