# Changelog

## 0.3.4

- Default new-game delivery to the pre-dev Chrona site `chrona-world.3-239-35-193.sslip.io`.
- Normalize the pre-dev `/worlds.html` directory URL to its site origin for CLI use.
- Avoid reusing a remembered Chrona connection from another site when no target site is supplied.

## 0.3.3

- Keep the 4 MiB text-entry limit as a technical constraint while raising the explicit-authorization threshold for a self-contained HTML delivery wrapper to 100 MB.

## 0.3.2

- Define the owned initial-import handoff: distinguish a branch preview from an editable Draft World, merge the reviewed first version into main when requested, and return the native editor link without launching or publishing.
- Document the 4 MiB text-entry limit for self-contained HTML and the original explicit-authorization requirement for a delivery-specific packaging wrapper.

## 0.2.0

- Add complete project checkout, World-scoped browser authorization and incremental source/asset upload.
- Add independent branches, three-way conflict resolution, previews, review, merge, release and restoration commands.
- Accept World links directly and reject mismatched sites; document first-version integration and existing-plugin upgrades.
- Preserve original dependencies and browser build output; keep delivery details separate from game creation.
- Retain the legacy v1 package tools for compatible older deployments.
- Require a Chrona server with the new collaboration API for the project workflow.

## 0.1.0

- Publish the Chrona Game Skill as one plugin for Codex and Claude Code.
- Add marketplace manifests and one-prompt installation instructions.
- Include the existing delivery workflow, v1 package contract, packaging CLI, SDK, and optional starter.
- Keep game creation in the agent's normal workflow and apply compatibility requirements during integration.
