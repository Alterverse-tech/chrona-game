# Chrona game package v1

The supported format is `chrona.game/v1`. A `.chrona-game.json` delivery file contains `{format, files, assets}`. `files` maps relative source paths to UTF-8 text. `assets` maps relative asset paths to `{sha256, base64}`. The CLI creates this transport format; do not manually embed large binaries.

`chrona.game.json` is a source file with these fields:

```json
{"format":"chrona.game/v1","id":"my-game","version":"1.0.0","title":"My Game","entry":"src/main.js","html":"index.html","styles":["style.css"],"scene":"scene.json","gameplay":"gameplay.js","coordinates":"cartesian","progress":"json","multiplayer":"none"}
```

`id` is a stable lowercase hyphenated ID; version is semver x.y.z. The platform World UUID is separate and assigned on creation. `entry`, `html` and `styles` must name included files. Nested directories are supported. Names contain ASCII letters, digits, `_`, `-`, `/` and a file extension; no traversal, symlinks or absolute paths. All new visible text defaults to English. Preserve user-authored names and content.

## Three editing tiers

- Scene: `scene.json` contains `entities` and `settings`. Each entity has stable `id`, `name`, `type`. Cartesian entities use `position:[x,y,z]` in metres. Sphere entities use `lon`, `lat` in radians. Optional color is `#rrggbb`; optional scale is positive. The game's authoring code defines which types/settings it implements. GLBs use `type:"glb", asset:"assets/model.glb"`. City authoring supports box, sphere, cone, cylinder, windmill, lamp and glb; `ground:false` gives absolute Y, otherwise Y is above terrain; `collision:false` disables the initial bounding-box collider.
- Gameplay: `gameplay.js` exports a factory returning `update(dt,time)` and optional `dispose()`. The game entry must call these. Expose entities, settings and the game-specific API; define any extra fields in source comments. Moving geometry with collision requires updating the physics collider in gameplay/runtime code.
- Runtime: all other source files, including the manifest, controllers, renderer and physics. The platform only compiles these; it never executes uploaded code in its Node server. Packages must implement all three tiers meaningfully; do not merely include unused placeholder scene or gameplay files.

## Dependencies and assets

Allowed package imports: `three` (platform 0.170.0), `three/addons/...js`, `@dimforge/rapier3d-compat` (platform pinned version), and `chrona`. Include other browser-only code as source if its licensing permits. No npm installation during import. ESM and top-level await are supported. Import JSON normally; glsl/txt/css module imports yield text. CSS in the manifest is injected automatically; use `asset:assets/name.png` in HTML/CSS for packaged URLs. JS uses `asset(path)`.

Assets may be GLB, bin, json, png, jpg, jpeg, webp, svg, mp3, ogg, wav, mp4 or woff2. GLBs should contain their images/buffers and avoid compression requiring unregistered decoders/workers. No external CDN scripts, fetches, iframe nesting, workers, host storage or account credentials. The sandbox allows only this build's read-only assets, which the platform stores separately by SHA-256, locally or in S3. Revisions retain resource hashes. Do not bake storage URLs into source.

Limits: 160 source files, 512 KB per source, 4 MB source total, 256 assets, 200 MB decoded assets, 280 MB transport package, 2,000 declarative entities. City baseline datasets are shared resource objects, not duplicated in source snapshots.

## Host SDK

```js
import {asset, ready, reportError, report, select, onInit, save, preview} from 'chrona';
const modelUrl = asset('assets/hero.glb');
onInit(progress => { /* restore this player's state, or initialize if null */ });
ready(); // after the game and required assets are actually ready
save({version:1, score:10}); // json progress: object <= 64 KB
select({coordinateSystem:'cartesian',objectId:'gate',name:'Gate',position:[1,0,2],camera:[2,3,4]});
```

Call `ready` after registering `onInit`. Report errors and dispose listeners, animation loops, audio and physics resources on teardown. `onInit` and `onMessage` return unsubscribe functions. `save` is acknowledged by `chrona:save-status` through `onMessage`; make consequential saves visible to the player. Preview never changes formal player saves. Published saves are separate per player and World. JSON progress is client-owned game data, not authoritative currency or multiplayer inventory. `progress:"none"` disables saves. `planet-v1` is the legacy Pocket Planet schema, not a generic save format.

`multiplayer:"none"` is the default for external games. `city-walking-v1` is the existing built-in city movement bridge: it does not synchronize custom vehicles, authored object state or new gameplay rules. A new authoritative multiplayer game requires a separately registered server implementation; a client package alone cannot provide it.

## Upload, versions and acceptance

The optional v1 preview helper requires `esbuild`, `three@0.170.0` and `@dimforge/rapier3d-compat@0.20.0` installed in the delivery directory. Run `node <skill>/scripts/game-kit.mjs preview <delivery-directory>` and refresh after edits. These are importer compatibility requirements, not instructions for choosing a new game's design or replacing the original project's development workflow.

Download the Skill from World Development, or install its folder in the coding client's skill directory. New World → Start With → Import a Game Package creates a private AI workspace with all three editing capabilities and imports the chosen file. Existing blank/imported worlds accept uploads through Draft Workspace. Chunk upload and final checksum are authenticated. Import requires runtime permission, validates package structure, stores resources and compiles the actual entry. A successful import creates a draft preview, never a silent publication. The world ID, members, history and current published version remain owned by the platform. Upload updates must retain package ID. Release with the normal Launch World / Release Update controls when requested; uploading does not enable Public access.

Acceptance evidence should identify package format validation, actual platform build, resource readability, and any human or browser gameplay checks separately. A passing package check alone does not prove a playable game.
