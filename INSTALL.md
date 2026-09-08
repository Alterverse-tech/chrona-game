# Install Chrona Game

Install the `chrona-game` plugin from the `chrona-game` marketplace. It exposes the **Chrona Game** Skill for packaging browser games and delivering them as owned, editable Chrona Worlds.

Use the instructions for the current client. Install into that client only, unless the user asks for both. If the plugin is already installed and listed as enabled, report that result instead of adding a duplicate installation. Do not delete an existing standalone Skill without the user's instruction.

## Codex

```bash
codex plugin marketplace add Alterverse-tech/chrona-game --ref main --json
codex plugin add chrona-game@chrona-game --json
```

Verify:

```bash
codex plugin marketplace list --json
codex plugin list --json
```

Confirm that the marketplace is `chrona-game`, the plugin is `chrona-game@chrona-game`, and the plugin is installed and enabled. If the client does not recognize `codex plugin`, report that the client needs a version supporting plugin marketplaces; do not claim installation succeeded.

## Claude Code

```bash
claude plugin marketplace add Alterverse-tech/chrona-game
claude plugin install chrona-game@chrona-game
```

Verify:

```bash
claude plugin marketplace list
claude plugin list
```

Confirm that the marketplace is `chrona-game`, the plugin is `chrona-game@chrona-game`, and the plugin is installed and enabled.

## Runtime and authentication

Packaging uses Node.js 20 or newer. Check `node --version` and report a missing or older runtime. This plugin has no MCP server or installation-time login. Packaging does not need the Chrona platform repository or an additional model API key.

The eventual upload requires a Chrona site with game-package import enabled and the user's normal browser sign-in. Never request browser cookies, passwords, or service tokens in chat. Browser automation must be available and authorized; otherwise provide the ready package and manual upload instructions.

## Start using the Skill

After successful verification, report the installed plugin and version. Start a new Codex task or Claude Code session so the Skill is discovered. If the client cannot open a new task or session itself, tell the user to do so.

Suggested first prompt:

```text
Make a third-person 3D planet game and upload it to Chrona.
```

Installation itself should not create a game, upload a package, publish a World, or change a game's source. The new task follows the user's game request and the Skill's delivery workflow.
