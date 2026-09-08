# Chrona Game

**Build a browser game in Codex or Claude Code. Bring it into Chrona as your own editable World.**

Keep your normal game creation workflow. When the game is ready, Chrona Game helps package it, import it into Chrona, and continue development through World Studio.

## Install with one prompt

Paste this into **Codex or Claude Code**:

```text
Read https://raw.githubusercontent.com/Alterverse-tech/chrona-game/main/INSTALL.md to install or update the Chrona Game plugin for this client, then connect once for game creation and publishing at https://chrona-world.3-224-51-165.sslip.io using its bundled CLI login --remember --publish. Open the authorization page automatically and wait for my confirmation. Do not create a game yet.
```

The browser opens automatically. Check the code, click **Connect** once, then return to your coding client and ask:

```text
Make a third-person 3D planet game, upload it to Chrona and publish the World. Give me its playable link.
```

The installation flow follows [Chrona 3D Assets](https://github.com/Alterverse-tech/chrona-3d-assets): add the marketplace and install the plugin. The creation guide then connects your coding client with one confirmation. Future games reuse the connection until you revoke it.

## What it does

Create the game normally, then deliver the complete editable project and its original build. Each member checks out an independent branch in Codex or Claude Code. Chrona tracks immutable commits, content-addressed assets, independent previews, conflicts, review, merge, release and restoration.

Uploading creates a development branch. Merging advances main; releasing changes the live game. Public discovery remains a separate setting. The owner uses Chrona's ordinary member roles to invite collaborators.

## Build together with one prompt

1. A uploads the game, previews it and merges the initial version into main.
2. B and C sign in to the same Chrona site. A adds their emails as **Full Developer** members.
3. B tells Claude Code: `Continue developing this World: WORLD_LINK. Add a harbor, preview it and submit the changes.`
4. C tells Codex: `Continue developing this World: WORLD_LINK. Add driving gameplay, preview it and submit the changes.`
5. Each person approves their own first client connection. The agents use separate branches. A reviews, merges and releases the result.

World links select the site and project automatically. Conflicts require explicit resolution and a new preview before approval. A member's branch does not change the live game until release. Both clients need plugin **0.3.0 or newer** and the target server needs the collaboration API.

## Manual installation

### Codex

```bash
codex plugin marketplace add Alterverse-tech/chrona-game --ref main --json
codex plugin add chrona-game@chrona-game --json
```

Verify:

```bash
codex plugin marketplace list --json
codex plugin list --json
```

### Claude Code

```bash
claude plugin marketplace add Alterverse-tech/chrona-game
claude plugin install chrona-game@chrona-game
```

Verify:

```bash
claude plugin marketplace list
claude plugin list
```

Continue in your client after connecting. Restart the session only if your client requires it to discover a newly installed Skill. See [INSTALL.md](INSTALL.md) for the complete installation instructions.

## Requirements

- A Codex or Claude Code client with plugin marketplace support.
- Node.js 20+ and a Chrona deployment with the collaboration API.
- The user's normal Chrona browser account to approve a World-scoped client connection.

The plugin has no MCP server, background hooks, model proxy, or installation-time login. The game uses its original engine, dependencies and build tools. Credentials stay outside the project; no cookies or tokens need to be pasted into chat.

## Create or join a World

Replace `CLI` with `plugins/chrona-game/skills/chrona-game/scripts/chrona.mjs` in a checkout of this repository, or the equivalent installed Skill path.

```sh
node CLI login --site https://your-chrona-site.example
node CLI create --dir ./my-game --name "My game"
node CLI push --dir ./my-game
# Build the game with its original tools, then:
node CLI preview --dir ./my-game --dist dist
```

A collaborator signs in separately:

```sh
node CLI login --site https://your-chrona-site.example --world WORLD_ID
node CLI checkout --world WORLD_ID --dir ./world-project --name "Forest task"
# Edit with Codex or Claude Code normally.
node CLI push --dir ./world-project
node CLI rebase --dir ./world-project
node CLI preview --dir ./world-project --dist dist
node CLI submit --dir ./world-project
```

`--world` also accepts the complete World link instead of a UUID; `--site` can then be omitted.

Use **World Development → Collaboration** to inspect changes and previews, review, merge and release. Full commands, conflict resolution, roles, source limits, S3 assets and hosting boundaries are in the [collaboration guide](plugins/chrona-game/skills/chrona-game/references/collaboration.md).

## Preserving the game

The Skill keeps delivery instructions out of the initial design stage. Static delivery stores the existing browser build and the full source project; it does not require switching to a Chrona game template or downgrading dependencies. Compare the original and hosted game to verify behavior at the hosting boundary. A sandbox can still affect origin storage, login popups, networking, and service workers; those require explicit integration when used.

Two independent model generations cannot be guaranteed to produce identical games. The testable guarantee is preservation of a given project's source and build, followed by visual and gameplay checks. Hosting does not automatically add multiplayer or account saves.

Older deployments can use the [v1 package importer](plugins/chrona-game/skills/chrona-game/references/package-contract.md) with `game-kit.mjs check` and `game-kit.mjs pack`. That path has its own supported runtime dependencies. The new collaboration CLI requires the corresponding server update; plugin installation does not upgrade the server.

## Repository layout

```text
.agents/plugins/marketplace.json
.claude-plugin/marketplace.json
plugins/chrona-game/
  .codex-plugin/plugin.json
  .claude-plugin/plugin.json
  skills/chrona-game/
    SKILL.md
    agents/openai.yaml
    references/collaboration.md
    references/package-contract.md
    scripts/chrona.mjs
    scripts/project-contract.mjs
    scripts/project-files.mjs
    scripts/game-kit.mjs
```

See [INSTALL.md](INSTALL.md) for installation and [CHANGELOG.md](CHANGELOG.md) for releases.
