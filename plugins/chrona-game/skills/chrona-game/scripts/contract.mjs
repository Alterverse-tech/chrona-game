// Shared by the platform and the distributable CLI. No platform dependencies.
export const FORMAT = 'chrona.game/v1'
export const LIMITS = { files: 160, sourceBytes: 4 * 1024 * 1024, fileBytes: 512 * 1024, assets: 256, assetBytes: 200 * 1024 * 1024, packageBytes: 280 * 1024 * 1024 }
export const safePath = p => typeof p === 'string' && p.length < 180 && /^[a-zA-Z0-9_-][a-zA-Z0-9_./-]*\.[a-zA-Z0-9]+$/.test(p) && p.split('/').every(s=>s&&!s.startsWith('.')&&!s.includes('..'))
export const sourcePath = p => safePath(p) && /\.(js|mjs|ts|json|html|css|glsl|txt)$/.test(p)
export const assetMime = p => ({glb:'model/gltf-binary',bin:'application/octet-stream',json:'application/json',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',svg:'image/svg+xml',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',mp4:'video/mp4',woff2:'font/woff2'})[p.split('.').at(-1)]
const fail = message => { throw new Error(message) }
export function validateManifest(m, files) {
 if (!m || m.format !== FORMAT || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(m.id || '') || m.id.length > 64 || !/^\d+\.\d+\.\d+$/.test(m.version || '')) fail('Invalid game format, ID or version')
 if (typeof m.title !== 'string' || !m.title.trim() || m.title.length > 100) fail('Game title is required (max 100 characters)')
 if (!['cartesian','sphere'].includes(m.coordinates)) fail('Coordinates must be cartesian or sphere')
 if (!sourcePath(m.entry) || !/\.(js|mjs|ts)$/.test(m.entry) || !sourcePath(m.html) || !m.html.endsWith('.html') || !Array.isArray(m.styles) || m.styles.length > 8 || m.styles.some(p => !sourcePath(p) || !p.endsWith('.css'))) fail('Invalid game entry, HTML or styles')
 if (m.scene !== 'scene.json' || m.gameplay !== 'gameplay.js') fail('Use scene.json and gameplay.js for editable content')
 if (!['none','json','planet-v1'].includes(m.progress) || !['none','city-walking-v1'].includes(m.multiplayer)) fail('Unsupported progress or multiplayer protocol')
 if (files) for (const p of [m.entry,m.html,...m.styles,m.scene,m.gameplay]) if (!Object.hasOwn(files,p)) fail('Missing required source: '+p)
 return m
}
export function validateScene(scene, coordinates = 'sphere') {
 if (!scene || !Array.isArray(scene.entities) || scene.entities.length > 2000 || !scene.settings || typeof scene.settings !== 'object' || Array.isArray(scene.settings)) fail('Scene requires entities (max 2000) and settings')
 const ids = new Set()
 for (const e of scene.entities) {
  if (!e || !/^[a-zA-Z0-9_-]{1,64}$/.test(e.id || '') || ids.has(e.id)) fail('Invalid or duplicate entity ID'); ids.add(e.id)
  if (typeof e.type !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(e.type) || typeof e.name !== 'string' || e.name.length > 100) fail('Invalid entity type or name')
  if (e.color !== undefined && !/^#[a-f0-9]{6}$/i.test(e.color)) fail('Invalid entity color')
  if (coordinates === 'sphere') { if (!Number.isFinite(e.lon) || Math.abs(e.lon)>Math.PI*2 || !Number.isFinite(e.lat) || Math.abs(e.lat)>Math.PI/2) fail('Invalid spherical location') }
  else if (!Array.isArray(e.position) || e.position.length!==3 || e.position.some(v=>!Number.isFinite(v)||Math.abs(v)>1000000)) fail('Invalid Cartesian position')
  for (const key of ['scale','elevation','yaw']) if (e[key]!==undefined && (!Number.isFinite(e[key]) || Math.abs(e[key])>100000)) fail('Invalid entity '+key)
  if (e.scale!==undefined && e.scale<=0) fail('Scale must be positive')
  if (e.asset!==undefined && (!safePath(e.asset) || !e.asset.endsWith('.glb'))) fail('Entity models must reference packaged GLB assets')
 }
 // Settings are declarative JSON; scripts belong in gameplay.js.
 if (JSON.stringify(scene).length>512*1024) fail('Scene data is too large')
 return scene
}
export function validateSources(files, manifest) {
 if (!files || Array.isArray(files) || typeof files!=='object' || Object.keys(files).length>LIMITS.files) fail('Invalid source files')
 let size=0
 for (const [p,text] of Object.entries(files)) {
  if (!sourcePath(p) || typeof text!=='string' || Buffer.byteLength(text)>LIMITS.fileBytes) fail('Invalid source path or size: '+p)
  size+=Buffer.byteLength(text)
 }
 if (size>LIMITS.sourceBytes) fail('Source size limit exceeded')
 validateManifest(manifest,files); validateScene(JSON.parse(files['scene.json']),manifest.coordinates)
 return {files: Object.keys(files).length, bytes:size}
}
export const legacyManifest = () => ({format:FORMAT,id:'pocket-planet',version:'1.0.0',title:'Pocket Planet',entry:'main.js',html:'index.html',styles:['planet.css'],scene:'scene.json',gameplay:'gameplay.js',coordinates:'sphere',progress:'planet-v1',multiplayer:'none'})
export const manifestFor = files => files['chrona.game.json'] ? validateManifest(JSON.parse(files['chrona.game.json']),files) : legacyManifest()
