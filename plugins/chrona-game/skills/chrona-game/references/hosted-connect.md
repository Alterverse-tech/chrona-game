# Existing accounts and multiplayer

Temporary architecture decision: optional `chrona.host/v1` lets a compatible host
own player identity and multiplayer, without changing standalone game behavior.
It is not required for static/single-player imports.

Before delivering an already-networked game, identify its identity source,
networking owner, storage needs and exact external origins. Do not remove login,
replace multiplayer or weaken the sandbox merely to pass upload.

Explicitly adapted static projects declare `integration: "chrona.host/v1"` in
delivery metadata. Verify the target runtime supports that exact version before
claiming compatibility. The operator configures the editable-World-to-realtime-
World mapping outside author-controlled source, separately for preview/published.
Missing bindings disable multiplayer; copies need their own approved binding.

Platform account credentials stay in the host. The game uses a bounded bridge
and must not start a second login or networking owner. Scoped browser preferences
are not cross-device saves. Static upload does not deploy a game's Node services;
deploy those separately when authorized, or report that concrete incompatibility.

Keep client authorization, member permissions, independent branches, checkout,
push, rebase, preview, submit, review, merge and publish unchanged. An upload
authorization is not a player credential. Do not broaden grants or publish to
work around an integration gap. Unsupported games remain importable as source,
but report runtime limitations instead of silently rewriting them.

Check handshake, World binding, single connection ownership, account-change
teardown and the standalone path. Build/hash checks are not gameplay acceptance.
