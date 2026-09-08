---
name: chrona-game
description: Upload a browser game to Chrona as an owned, editable World, or continue building an existing World with other members in Codex or Claude Code. Handles project delivery and collaboration after ordinary game creation.
---

# Chrona game delivery and collaboration

For creation plus upload, develop the game using the agent's normal workflow and the user's chosen tools first. Preserve the intended gameplay, art direction, assets and dependencies. Read delivery details only when the playable project is ready. The optional starter is for an explicit scaffold request.

For upload or continued collaboration, read [the project workflow](references/collaboration.md). Use the bundled `scripts/chrona.mjs` CLI to authorize, create or check out a World, push source changes, and upload a branch preview. Keep the complete project and lockfile; the server stores binary assets by content hash. Each member works on an independent branch. Review, merge, and release are distinct operations with server-enforced permissions and version checks.

Keep creation and delivery changes separate and retain a working original. Static delivery uses the game's own build output. Do not remove effects, replace assets, change controls, downgrade dependencies, or introduce mandatory gameplay SDK code to pass an importer. Check browser behavior at the hosting boundary; ordinary hosting does not automatically add account saves, multiplayer, or other game-specific features.

If the target deployment only supports the older package importer, read [the v1 package contract](references/package-contract.md) before preparing that integration. Report a concrete incompatibility instead of silently changing the game. Do not present independent model generations as guaranteed identical.

Use the user's normal browser sign-in for client authorization; never request passwords, cookies, or tokens in chat. Upload creates a development branch. Submit, approve, merge or release only within the user's requested scope; public discovery is a separate setting. Report the World and branch links, actual release status, and checks performed. Build and hash checks do not establish visual or gameplay correctness.
