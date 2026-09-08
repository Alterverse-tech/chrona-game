# Shared World projects

Requirements: Node.js 20+, a Chrona deployment with the collaboration API, and a member role with development permissions. Codex and Claude Code run the same CLI. Replace `CLI` below with the absolute path to this Skill's `scripts/chrona.mjs`. Use the user's target site.

## Deliver a completed game

```sh
node CLI login --site https://your-chrona-site.example
node CLI create --site https://your-chrona-site.example --dir ./my-game --name "My game"
node CLI push --dir ./my-game --summary "Import complete game project"
# Build using this project's original tools and lockfile, then:
node CLI preview --dir ./my-game --dist dist
```

Login prints a browser approval URL and waits. The user verifies the code using their normal Chrona account. Credentials stay outside the project in `~/.config/chrona/clients.json`, with private file permissions and a 24-hour lifetime. `CHRONA_CONFIG_DIR` selects another local configuration. A creation grant becomes bound to the new World. Another World requires separate authorization. `/studio/connect/` lists and revokes clients.

Source snapshots include code, package metadata, dependency lockfiles, build configuration, documentation and binary assets. They exclude credentials, `.env*`, `.git`, `.chrona`, dependencies, caches, `dist`, `build`, `artifacts`, and test reports. Unsupported paths and symlinks fail explicitly. Limits: 1,200 text files, 4 MiB per file, 32 MiB text total; 1,000 binary files, 512 MiB binary total. A 150 MB map fits the binary budget. Configured servers can store blobs in S3. Unchanged asset hashes do not upload again.

Builds need relative asset URLs. Vite can use `base: './'` or a delivery build with `--base=./`; preserve game logic. `preview --build` optionally runs the existing `npm run build`; `--script NAME` selects another existing npm script. Without this flag, supply output built from the pushed source. The server labels uploaded output as an author-supplied build; it does not pretend to have rebuilt it.

## Join and develop

The owner adds the other person's Chrona account through World Development → Player & Creator Access. Each person authorizes their own account.

Before collaborators start, the owner previews, submits, reviews and merges the initial upload into main. Uploading alone leaves it on the creator's branch. Release separately when requested. Add collaborators as **Full Developer** after they have signed in to that Chrona site at least once; this does not grant approval or release permissions.

When the user supplies a World link, pass the complete link to `--world`; the CLI selects its site and World ID. Supported links include `/studio/?world=...`, `/studio/collaboration/?world=...` and `/play/WORLD_ID/`. A link never grants access: every collaborator authorizes their own account. For example:

```sh
node CLI login --world 'https://your-chrona-site.example/studio/?world=WORLD_ID'
node CLI checkout --world 'https://your-chrona-site.example/studio/?world=WORLD_ID' --dir ./harbor-task --name "Add a harbor" --client "Claude Code"
```

```sh
node CLI login --site https://your-chrona-site.example --world WORLD_ID
node CLI checkout --world WORLD_ID --dir ./world-project --name "Forest task"
node CLI status --dir ./world-project
node CLI diff --dir ./world-project
# Develop using the coding agent normally, then:
node CLI push --dir ./world-project --summary "Improve forest navigation"
node CLI rebase --dir ./world-project
node CLI preview --dir ./world-project --dist dist
node CLI submit --dir ./world-project --title "Improve forest navigation"
```

Checkout requires an empty destination and pins a complete immutable version. `pull` updates your branch and refuses to overwrite unpushed edits. `branch --name TEXT` starts another task from main. A merged branch cannot receive more writes. `.chrona/workspace.json` stores the binding and pending request record; keep it private and out of Git. After an uncertain network result, retry the same command before further editing.

`rebase` integrates main using the common ancestor. Text merges normally; `scene.json` merges entities by stable `id` and field. Same-field, binary replacement, add/add and delete/edit disagreements produce conflicts. Unkeyed arrays remain atomic. Conflict details go to `.chrona/conflicts.json`; local source is preserved. `ours` is main and `theirs` is your branch.

Create a JSON resolution map outside the project: each conflicting path maps to its complete resolved text, asset reference `{sha256,bytes,mime}`, or `null` for deletion. `@delivery` resolves hosting metadata. Run `node CLI rebase --dir ./world-project --resolve /path/to/resolutions.json`. If versions change, refresh conflict data. Never silently choose the last writer. Rebuild and inspect before submitting again.

## Review and release

World Development → Collaboration exposes source, changes, independent previews, review, merge and release. Merging advances main; release changes the live World. The server rechecks source/build hashes, main, review version, membership and policy. An authorized reviewer can add `--publish` to `login --world WORLD_ID`, then use:

```sh
node CLI review --dir ./world-project --submission SUBMISSION_ID
node CLI merge --dir ./world-project --submission SUBMISSION_ID
node CLI publish --dir ./world-project
node CLI restore --dir ./world-project --commit COMMIT_SHA
```

Restore creates a branch with historical source and follows the ordinary review/release path. World identity, members and stored player progress stay with the World. Game code remains responsible for intentional save-schema migrations. Public discovery is separate from releasing.

Viewers can use `login --read-only` and `checkout --read-only`. A release reviewer who cannot edit source uses `login --read-only --publish` and a read-only checkout for review/merge/release commands.

## Hosting and operational boundaries

Static builds run in an opaque sandbox with scripts and pointer lock. Assets use immutable World-specific URLs; no platform credentials enter the game. Network access is denied by default. Required exact HTTPS/WSS origins can be configured with `node CLI configure --dir PROJECT --delivery /path/to/delivery.json`, then pushed. Example metadata: `{"mode":"static","entry":"index.html","outputDirectory":"dist","connectOrigins":["https://api.example.com"]}`. Configure only dependencies the game actually requires.

Login popups, origin-local storage, service workers and unrestricted embedding are not guaranteed in this sandbox. Static hosting does not automatically add native account saves or multiplayer. Identify concrete integration gaps instead of silently changing the game. Registered v1 projects keep their existing SDK/compiler through `delivery.mode: "v1"`; see the separate package contract.

Web Agent file tools use the same branch/version rules. For npm projects, an administrator can enable a trusted, locally available Docker image through `WORLD_PROJECT_BUILD_IMAGE`. The worker installs the original lockfile with lifecycle scripts disabled, then builds without network. Containers receive only a disposable project directory, with resource limits and no host credentials or Docker socket. Other build systems can upload their local static output. Worker availability is separate from game compatibility.

The current metadata store supports one Chrona writer process per data directory. Horizontal deployment needs a shared transactional store or distributed locking. Immutable build URLs are capability links; keep private previews private. Resource garbage collection, shorter-lived preview grants, quotas and dependency caches are follow-up operational improvements.
