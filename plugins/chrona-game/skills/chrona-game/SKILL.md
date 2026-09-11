---
name: chrona-game
description: Upload a browser game to Chrona as an owned, editable World, or continue building an existing World with other members in Codex, Claude Code, or WorkBuddy. Handles project delivery and collaboration after ordinary game creation.
---

# Chrona game delivery and collaboration

For creation plus upload, develop the game using the agent's normal workflow and the user's chosen tools first. Preserve the intended gameplay, art direction, assets and dependencies. Read delivery details only when the playable project is ready. The optional starter is for an explicit scaffold request.

For upload or continued collaboration, read [the project workflow](references/collaboration.md). Use the bundled `scripts/chrona.mjs` CLI to authorize, create or check out a World, push source changes, and upload a branch preview. Keep the complete project and lockfile; the server stores binary assets by content hash. Each member works on an independent branch. Review, merge, and release are distinct operations with server-enforced permissions and version checks.

## Chrona site selection

This plugin distribution uses `https://chrona-world.3-239-35-193.sslip.io` as its default Chrona site. The browser directory is `https://chrona-world.3-239-35-193.sslip.io/worlds.html`; CLI commands use the site origin without the `/worlds.html` path. The bundled CLI also normalizes a `/worlds.html` site URL to its origin.

For a new game or a task without a concrete World link, pass the default site explicitly to `login` and keep it for `create`, `push`, `preview`, `submit`, `merge` and `publish`. Do not infer a different site from a remembered credential, and do not silently use `chrona.world`. When the user supplies a complete World link, its origin and World ID are authoritative; preserve that explicit target rather than replacing it with a default.

## Owned initial imports

For games with existing login or multiplayer, read
[hosted account compatibility](references/hosted-connect.md) before delivery.
Check the optional integration contract without changing client authorization
or collaborative editing. Do not silently rewrite login, networking or World
bindings during upload.

Treat a branch `previewUrl` as branch-scoped evidence, not as the final editable-World link. For an owned initial import where the user asks to upload a game as an editable World (rather than merely requesting a branch preview), preview the source version, then submit, review, and merge that initial version into `main`. Do not publish or launch the World unless the user requests it.

After the merge, return the native editor link in the form `https://SITE/studio/?world=WORLD_ID`. Verify from `status` that `main` is the imported commit, a build exists for it, and `published` is null/false. Report that as a Draft World with Launch available; browser UI verification remains separate. For shared Worlds or a request limited to a branch preview, leave merging to the owner or to an explicit request.

## Large self-contained HTML

Check source snapshot limits before importing a standalone HTML game. A text entry over 4 MiB cannot be pushed as source; that is a technical server limit, not the authorization threshold. For an unpacked single-file HTML no larger than 100 MB, a delivery-specific wrapper may be introduced when needed to cross that limit, provided it preserves the original outside the wrapper, verifies recovered bytes by SHA-256, does not change gameplay, and is disclosed in the delivery. For an unpacked single-file HTML over 100 MB, preserve the original and report the incompatibility; do not silently rewrite the game or add a loader without the user's explicit packaging authorization. Validate hosted behavior separately in either case.

Keep creation and delivery changes separate and retain a working original. Static delivery uses the game's own build output. Do not remove effects, replace assets, change controls, downgrade dependencies, or introduce mandatory gameplay SDK code to pass an importer. Check browser behavior at the hosting boundary; ordinary hosting does not automatically add account saves, multiplayer, or other game-specific features.

If the target deployment only supports the older package importer, read [the v1 package contract](references/package-contract.md) before preparing that integration. Report a concrete incompatibility instead of silently changing the game. Do not present independent model generations as guaranteed identical.

Use the user's normal browser sign-in for client authorization; never request passwords, cookies, or tokens in chat. Upload creates a development branch. Submit, approve, merge or release only within the user's requested scope; public discovery is a separate setting. Report the World and branch links, actual release status, and checks performed. Build and hash checks do not establish visual or gameplay correctness.
