# Install Chrona Game

Install the `chrona-game` plugin from the `chrona-game` marketplace. It exposes the **Chrona: Chrona Game** Skill for delivering complete browser game projects and collaborating on owned, editable Chrona Worlds. The prefixed display name is included in version **0.3.5 or newer**.

Use the instructions for the current client. Install into that client only, unless the user asks for both. Collaboration requires version **0.3.1 or newer**. If that version is already installed and enabled, report it without duplicating the installation. Upgrade older versions using the commands below. Do not delete an existing standalone Skill without the user's instruction.

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

For an existing older installation:

```bash
codex plugin marketplace upgrade chrona-game --json
codex plugin add chrona-game@chrona-game --json
```

Verify the installed version again before starting a new task.

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

For an existing older installation:

```bash
claude plugin marketplace update chrona-game
claude plugin update chrona-game@chrona-game
```

Verify the installed version again. Complete any requested connection before restarting the Claude Code session.

## WorkBuddy / CodeBuddy

Use the current client's plugin manager. This repository includes `.workbuddy-plugin` and `.codebuddy-plugin` metadata alongside its Codex and Claude Code metadata.

```text
/plugin marketplace add Alterverse-tech/chrona-game
/plugin install chrona-game@chrona-game
```

When running commands on the user's behalf, use the current client's available CLI or plugin-install tool; inspect its `plugin --help` before using noninteractive commands. Do not run `codex` or `claude` to install into WorkBuddy. Verify the plugin appears enabled in that client's installed list, then run the same bundled Chrona CLI connection step below with `--client "WorkBuddy"`.

For a WorkBuddy version that only exposes local Skill import, prepare `plugins/chrona-game/skills/chrona-game` as a local Skill package and use its supported import flow. Do not invent an installation path or claim installation finished before the client recognizes it. See the official [WorkBuddy Skills guide](https://www.workbuddy.cn/docs/workbuddy/From-Beginner-to-Expert-Guide/Function-Description/Skills-Market), [plugin reference](https://www.codebuddy.ai/docs/cli/plugins-reference), and [marketplace guide](https://www.codebuddy.ai/docs/cli/plugin-marketplaces).

## Runtime and authentication

Packaging uses Node.js 20 or newer. Check `node --version` and report a missing or older runtime. This plugin has no MCP server. When the user asks to connect as part of setup, complete the connection below after installation. Packaging does not need the Chrona platform repository or an additional model API key.

Collaboration requires a Chrona site with the collaboration API. Installing the plugin does not upgrade the server.

## Connect once

If the setup prompt says **"Open the authorization page automatically and wait for my confirmation"**, complete the connection before helping start the new task or session. No separate terminal command is required from the user.

Use the site from the user's World link or explicit request. If neither is supplied, use the pre-dev Chrona site `https://chrona-world.3-239-35-193.sslip.io`. Its browser directory is `https://chrona-world.3-239-35-193.sslip.io/worlds.html`; CLI commands use the origin without `/worlds.html`. Do not fall back to `chrona.world` or another remembered site. Run the installed Skill's `scripts/chrona.mjs` after verifying version 0.3.4 or newer:

```sh
node /ABSOLUTE/INSTALLED/SKILL/scripts/chrona.mjs login --site https://chrona-world.3-239-35-193.sslip.io --remember --publish --client "Codex"
```

Use the actual installed path and selected site. Set `--client` to the current tool: Codex, Claude Code, or WorkBuddy. The creation guide requests permission to create, edit, and publish Worlds created through this connection; the browser explains this access and the user confirms it. Do not publish any game during installation. Locate the installed Skill through the client's plugin listing or installation directory; do not ask the user to copy a token or find that path.

The CLI automatically opens Chrona. Ask the user to check the displayed code and click **Connect** once. Keep the login process running until it confirms connection. The page attempts to close after the CLI saves the connection; if the browser prevents closing, the user can close the tab and return to the client. A missing browser prints the same authorization link as a fallback.

The connection is reused for future tasks and games on that site, until revoked under Chrona's connections page. It only covers Worlds created by that connection; joining existing Worlds still uses their own member authorization. Credentials remain outside the project. Never request cookies, passwords, or tokens in chat. A setup request that does not ask for authorization installs the plugin only.

## Start using the Skill

After the CLI confirms connection, report the installed plugin and help start the new task or session when the user requested one. If the client cannot start it automatically, give the shortest instruction for opening one. The saved connection remains usable. The agent can also read the installed `SKILL.md` directly when continuing immediately.

Suggested prompt:

```text
Make a third-person 3D planet game. When it is ready, upload it to Chrona and publish the World. Give me its playable link.
```

Installation itself should not create or publish a game. Once the user requests a game, use the agent's normal creative workflow and read delivery details when the playable project is ready. A request to publish authorizes submitting, approving, merging and releasing that game's update through the CLI; do not require the user to repeat that intent at every command. Public discovery is a separate setting.

## Edit an existing or shared World

The same installation supports creation and editing. The user can start a task with:

```text
Continue developing this World: WORLD_LINK. Add a harbor, preview it and submit my changes for review.
```

Read the installed Skill's collaboration workflow. Use the supplied link with `login --world WORLD_LINK` and `checkout --world WORLD_LINK`; let the CLI reuse access if available or open the authorization page when needed. For a shared World, the owner must first add the user as a developer. Membership and authorization are separate from installation. Each collaborator edits their own branch, previews and submits; the owner chooses what to merge and publish. Do not ask collaborators to install again for another World.
