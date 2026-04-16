# I18n Auto Replace

<a href="https://marketplace.visualstudio.com/items?itemName=linghaosu.i18n-auto-replace" target="__blank"><img src="https://img.shields.io/visual-studio-marketplace/v/linghaosu.i18n-auto-replace.svg?color=eee&amp;label=VS%20Code%20Marketplace&logo=visual-studio-code" alt="Visual Studio Marketplace Version" /></a>

A VS Code extension that keeps paired i18n locale JSON files in sync with your source files, and gives you quick navigation between them.

## Features

- **Auto create paired locale files** when you add a new source file — one JSON per locale directory, with the mirrored path inside `src/locales/<locale>/…`.
- **Auto rename & propagate** — renaming a source file renames every paired locale JSON, and the key path inside the file content is rewritten to match.
- **Auto delete (opt-in)** — deleting a source file can delete its paired locales too, gated by `enableDelete`.
- **Editor title dropdown** — a single i18n icon in the editor title area opens a native submenu with context-aware actions:
  - In a source file: *Open paired locale file* / *Open specified locale file…* / *Quick create paired locale files*
  - In a locale JSON file: *Open paired source file* / *Open specified locale file…*
- **Smart paired-file picker** — the quick-pick only lists locales that actually have a paired JSON for the current file.
- **Split-view aware** — opening a paired file reuses the other editor group when one exists, otherwise splits.
- **Key path helper** — `Copy relative key path` copies the dotted i18n key for the current file, or inserts it as a snippet when invoked from the editor.

## Configuration

| Setting | Default | Description |
| --- | --- | --- |
| `i18n-auto-replace.ext` | `["vue"]` | Source file extensions to watch. |
| `i18n-auto-replace.srcPath` | `["src"]` | Source directory (relative to workspace root). |
| `i18n-auto-replace.localePath` | `["src", "locales"]` | Directory that contains locale subfolders. |
| `i18n-auto-replace.defaultLocaleLang` | `"zh-CN"` | Locale opened by the default "Open paired locale file" action. |
| `i18n-auto-replace.enableDelete` | `false` | When `true`, deleting a source file also deletes its paired locale JSONs. |
| `i18n-auto-replace.exclude` | `["src/locales"]` | Path prefixes to skip (the locales directory itself is excluded by default). |

## Convention

For a source file at `src/<path>/<name>.<ext>`, the extension expects — and maintains — paired JSON files at:

```
<localePath>/<locale>/<path>/<name>.json
```

For example, with the defaults and a locale directory containing `zh-CN` and `en-US`:

```
src/components/Foo.vue
└─► src/locales/zh-CN/components/Foo.json
└─► src/locales/en-US/components/Foo.json
```

## Commands

| Command | Purpose |
| --- | --- |
| `I18n Auto Replace: Open paired locale file` | Opens the default locale JSON for the active file. |
| `I18n Auto Replace: Open paired specified locale file` | Lets you pick from locales that have a paired JSON. |
| `I18n Auto Replace: Open paired source file` | Jumps from a locale JSON back to its source file. |
| `I18n Auto Replace: Quick create paired locale file` | Creates any missing locale JSONs for the active file. |
| `I18n Auto Replace: Copy relative key path` | Copies/inserts the dotted key path for the current file. |

All commands are also available from the explorer context menu, the editor context menu, and the i18n submenu in the editor title bar.

## Project Structure

```
src/
├── commands/          command handlers (open/copy/etc.)
├── watchers/          file-system listeners (create/rename/delete)
├── utils.ts           workspace + path helpers
├── settings.ts        configuration reader
├── log.ts             output channel logger
└── index.ts           activation entry, command wiring, context keys
locales/               NLS source (en, zh) — compiled into package.nls.*.json
resources/             extension icon + action icons
scripts/               build scripts (NLS compile, etc.)
```

## Development

```bash
pnpm install
pnpm dev           # build + watch
# F5 in VS Code to launch the Extension Development Host
pnpm check         # typecheck + lint
pnpm pack          # produce a local .vsix
```

The launch config in `.vscode/launch.json` starts the Extension Development Host with `--disable-extensions` so nothing else interferes.

## Release

Releases are tag-driven. Everything else is automated by the `.github/workflows/release.yml` workflow.

```bash
pnpm run release
```

This runs `pnpm check`, then [`bumpp`](https://github.com/antfu/bumpp) prompts for the next version, updates `package.json`, regenerates `CHANGELOG.md` via [`changelogen`](https://github.com/unjs/changelogen), commits, tags (`vX.Y.Z`), and pushes.

When the tag lands on GitHub, the workflow:

1. Runs `check` + `build`, packages the extension as `i18n-auto-replace-<tag>.vsix`.
2. Creates a GitHub Release with auto-generated notes and attaches the `.vsix`.
3. Publishes to the VS Code Marketplace (needs `VSCE_PAT` secret).
4. Publishes to Open VSX if `OVSX_PAT` secret is set (skipped otherwise).

## License

[MIT](./LICENSE) License © 2022-present [linghao.su](https://github.com/linghaoSu)
