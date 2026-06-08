# Antigravity Chinese Patch Design

## Goal

Provide a reversible Simplified Chinese UI patch for Google Antigravity without distributing or modifying Antigravity binaries. The patcher installs a user-local VS Code-compatible language pack and registers `zh-cn` in Antigravity's user data directory.

## Approach

The patcher reads Antigravity's `resources/app/out/nls.keys.json` and `nls.messages.json`, merges an upstream MIT-licensed VS Code Simplified Chinese language pack with project-owned Antigravity overrides, and writes a generated language pack under the user's `.antigravity/extensions` directory.

The patcher updates only:

- `%APPDATA%/Antigravity/languagepacks.json`
- `%APPDATA%/Antigravity/User/locale.json`
- `%USERPROFILE%/.antigravity/extensions/codex.antigravity-cn-patch-*`

It does not edit `Antigravity.exe`, `app.asar`, `resources/app`, or any installed Antigravity program file.

## Safety

Before writing user data files, the patcher stores timestamped backups. `restore` copies those backups back or removes the patch language-pack registration when no backup is present.

The repository does not include Antigravity files or VSIX payloads. It includes only source code, tests, and project-owned overrides. Upstream language-pack files are read from a local VS Code installation, a user-provided extracted extension/VSIX, or downloaded by the user at apply time.

## Verification

Automated tests cover translation merging, manifest generation, backup/restore behavior, and strict-mode missing-translation reporting. The `status` command reports key coverage and generated fallback count.
