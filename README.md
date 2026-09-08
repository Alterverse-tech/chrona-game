# Chrona Game

**Build a browser game in Codex or Claude Code. Bring it into Chrona as your own editable World.**

Keep your normal game creation workflow. When the game is ready, Chrona Game helps package it, import it into Chrona, and continue development through World Studio.

## Install with one prompt

Paste this into **Codex or Claude Code**:

```text
Read https://raw.githubusercontent.com/Alterverse-tech/chrona-game/main/INSTALL.md to install the Chrona Game plugin for this client, then help me start a new task or session.
```

After installation, start a new task or session and ask:

```text
Make a third-person 3D planet game and upload it to Chrona.
```

The installation flow follows [Chrona 3D Assets](https://github.com/Alterverse-tech/chrona-3d-assets): add the marketplace, install the plugin, and start a new session.

## What it does

| Stage | What happens |
| --- | --- |
| Create | The coding agent develops the game using your prompt, chosen tools, and normal workflow. The bundled starter is optional. |
| Integrate | Prepare a separate delivery copy, connect the Chrona SDK and editable scene/gameplay entry points, and check the package. |
| Import | Sign in to your Chrona site and import the package as an owned, private World with a draft preview. |
| Continue | Use the World's members, development settings, Agent, source revisions, drafts, and release controls. |

You can also ask to upload an existing game or update an existing World. Updates retain the package ID and World history.

**Uploading creates a draft.** Launching or releasing an update requires a release request; public access is a separate setting.

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

Start a new task or session after installation so the client discovers the Skill. See [INSTALL.md](INSTALL.md) for the complete installation instructions.

## Requirements

- A Codex or Claude Code version that supports plugin marketplaces.
- Node.js 20 or newer for the packaging CLI.
- A Chrona deployment with the `chrona.game/v1` importer and your normal web sign-in.
- Authorized browser access for the agent to complete the upload. Without it, the agent provides the package and the remaining manual upload step.

This plugin has no MCP server, background hooks, or installation-time authentication. Packaging does not require the Chrona platform repository or an additional model API key. Upload uses your Chrona browser session.

## Preserving the game

The Skill postpones the delivery contract until integration and keeps the original game available for comparison. It must not silently remove effects, replace artwork, change controls, or downgrade dependencies to satisfy the importer.

The current importer **recompiles supported browser source**. It does not host arbitrary builds unchanged. Supported dependencies, sandbox restrictions, assets, saves, and multiplayer boundaries are documented in the [package contract](plugins/chrona-game/skills/chrona-game/references/package-contract.md). Incompatible features must be identified before changing the game.

This workflow does not guarantee that two independent model generations produce identical games. Package validation also does not prove identical visuals or gameplay; compare the original and imported game to verify those properties.

## Packaging an existing delivery project

From a checkout of this repository, once the project satisfies the package contract:

```bash
node plugins/chrona-game/skills/chrona-game/scripts/game-kit.mjs check /path/to/delivery
node plugins/chrona-game/skills/chrona-game/scripts/game-kit.mjs pack /path/to/delivery /path/to/game.chrona-game.json
```

In Chrona, choose **Create → New World → Start With → Import a Game Package**. To update an existing compatible World, use **World Development → Draft Workspace → Upload Game Package**.

The included CLI supports `init`, `check`, `pack`, and an optional `preview` helper. It does not provide a direct upload API. Preview dependencies and package limits are listed in the contract.

## Repository layout

```text
.agents/plugins/marketplace.json       Codex marketplace
.claude-plugin/marketplace.json        Claude Code marketplace
plugins/chrona-game/
  .codex-plugin/plugin.json            Codex plugin
  .claude-plugin/plugin.json           Claude Code plugin
  skills/chrona-game/
    SKILL.md                          Delivery workflow
    agents/openai.yaml                Skill display metadata
    references/package-contract.md    Import and runtime contract
    scripts/                          Packaging CLI and SDK
    assets/starter/                   Optional starter project
INSTALL.md                            Instructions for installation agents
```

Marketplace: `chrona-game` · Plugin: `chrona-game` · Skill: `chrona-game`

For standalone Skill installation, copy `plugins/chrona-game/skills/chrona-game` into `~/.codex/skills/` or `~/.claude/skills/` instead of installing the plugin. Choose one installation method per client to avoid duplicate Skill entries.
