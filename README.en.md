<div align="center">

<img src="icon.svg" width="96" height="96" alt="dsh-skill-labels" />

# dsh-skill-labels

**Puts a short Chinese caption in front of every skill in DeepSeek Harness, so you can tell what each one does at a glance.**

`html-ppt` → `【写PPT】HTML PPT Studio — author professional static HTML presentations …`

</div>

---

After installing, the skill list stops being a wall of English names:

```text
- `html-ppt`:      【写PPT】HTML PPT Studio — author professional static HTML presentations …
- `office-docx`:   【写Word】Create, read, edit, and check Word documents (.docx) …
- `office-xlsx`:   【写Excel】Read, create, and modify Excel workbooks (.xlsx) …
- `vision-skills`: 【看图还原界面】把截图或设计图还原为 UI …
```

The Chinese caption goes **in front**, and the original English description is kept **as-is** — its trigger words are what the model uses to pick a skill, so translating them away would make skills harder to find.

## Features

- **Caption first** — a 4–7 character Chinese label in front of each skill description.
- **Both surfaces** — the model-facing skill catalog *and* the `/` slash menu.
- **Edit and it's live** — labels live in `labels.json`; edit the file, no restart, no reinstall.
- **Zero dependencies, zero config** — no npm deps, no network, no disk writes.
- **Unknown skills untouched** — anything not in your table is left exactly as it was.
- **Clean uninstall** — the plugin restores the registry methods it wrapped.

## Install

```bash
dsh plugin --profile web add github:Siloet-phy/dsh-skill-labels
```

Use `--profile desktop` for the Desktop app profile, or `file:/abs/path/dsh-skill-labels` for a local checkout.

## Configure

Works out of the box. Labels are merged from four places, later wins:

1. built-in `DEFAULT_LABELS`
2. bundled `labels.json`
3. **your own** `~/.dsh/skill-labels.json` (survives upgrades)
4. row config `config.labels`

```json
{ "my-own-skill": "我的技能", "html-ppt": "做幻灯片" }
```

Optional row config: `format` (default `【{label}】{description}`), `labels`, `labelsFile`.

## How it works

Every consumer of the skill catalog goes through `SkillRegistry.snapshot()/list()` — `dsh-tool-skill` renders the model catalog from `snapshot()`, and the `/` menu reaches the host through `sessionSkillCatalog.list()` → `skillRegistry.list()`. The plugin wraps those two methods on the registry **prototype** and rewrites each summary's `description` just before it is delivered. It is idempotent per object (`WeakSet`), touches nothing but `description` (never the body, name, or invocation policy), and restores the original methods when unloaded. If a future DSH renames the methods, the plugin only logs a warning and the catalog stays as it was.

## Compatibility

DeepSeek Harness `0.2.0-rc.2` (tested); any profile that mounts `@deepseek-ai/dsh-skill` + `dsh-tool-skill`; Windows / macOS / Linux; Node >= 20; no third-party dependencies and no peer dependencies.

## Privacy

No network calls, no telemetry, no writes. The only file access is reading two optional JSON label files.

## License

[MIT](LICENSE) © 2026 Siloet-phy

[中文说明](README.md)
