# Antigravity Chinese Patch Design

## Goal

Provide a reversible Simplified Chinese UI patch for Google Antigravity without distributing Antigravity binaries or copied Antigravity resources.

## Approach

The patcher applies two translation layers:

- Workbench NLS: read Antigravity's `resources/app/out/nls.keys.json` and `nls.messages.json`, merge an upstream MIT-licensed VS Code Simplified Chinese language pack with project-owned overrides, then register the generated language pack under the user's `.antigravity/extensions` directory.
- Agent UI runtime patch: append a small marked translator block to installed renderer bundles such as `out/main.js`, `out/jetskiAgent/main.js`, and `out/vs/workbench/workbench.desktop.main.js`. The injected code translates text nodes, placeholders, labels, and tooltips for hardcoded Antigravity UI strings.

The runtime patch is used because the Agent home screen contains strings that are not routed through VS Code NLS.

## Safety

Before writing user data files or UI bundles, the patcher stores timestamped backups in the Antigravity user-data directory. `restore` copies those backups back or removes files that did not exist before the patch.

The runtime block is surrounded by stable markers:

- `/* antigravity-cn-patch:runtime-start */`
- `/* antigravity-cn-patch:runtime-end */`

Reapplying the patch replaces the previous marked block instead of stacking duplicate code.

## Platform Support

The path resolver supports:

- Windows: `resources/app`
- macOS: `Antigravity.app/Contents/Resources/app`
- Linux: common `/usr/share` and `/opt` install roots

VSIX extraction tries platform-appropriate tools: `unzip`/`tar` on macOS/Linux and `tar`/PowerShell on Windows.

## Verification

Automated tests cover translation merging, path resolution, UI bundle injection, backup/restore behavior, dry-run behavior, and cross-platform VSIX extraction command selection.
