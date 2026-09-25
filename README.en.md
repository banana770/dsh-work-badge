# dsh-work-badge

**A tiny badge for the DSH (DeepSeek Harness) web UI that answers one question at a glance: are we in peak hours right now?**

**English** · [简体中文](./README.md)

---

## What this plugin does

Once installed, a single small line appears in the **top-left corner of the DSH content area, below the Windows menu bar and just above the DeepSeek brand**, showing the current period in real time:

| What you see | Meaning | When it shows (Beijing time, UTC+8) |
| --- | --- | --- |
| 工作时间：**峰** (blue) | Peak hours | Mon-Fri, `9:00-12:00` and `14:00-18:00` |
| 工作时间：**谷** (grey) | Off-peak hours | Everything else, including the whole weekend |

In one sentence: **"峰" means you are inside peak hours, "谷" means off-peak.** With the English UI text enabled the badge reads `Work hours: Peak` / `Work hours: Off-peak` instead.

That label is the plugin's entire job. It is deliberately minimal:

- **It only reports state.** It does not change anything in DSH: no input handling, no model settings, no access to conversation content.
- **It never blocks clicks.** The label lives in a frame-wide floating layer with `pointer-events: none`, so clicking a brand or icon underneath it works exactly as before.
- **It stays out of the way.** 10 px text on a rounded translucent pill, pinned below the Windows menu bar in the top-left corner, unaffected by sidebar or conversation-list scrolling.
- **Bilingual.** The UI text follows the browser language by default, and can be pinned to Chinese or English with one constant (see below).

## How the period is decided

- The clock is always **Beijing time (UTC+8, fixed offset, no DST)** — independent of your machine's timezone. Change your system timezone or travel abroad and it still reads correctly.
- Only **Monday to Friday** counts as peak; **Saturdays and Sundays are off-peak all day**.
- Evaluated **by the minute, start inclusive and end exclusive**: `9:00` is peak, `11:59` is still peak, and `12:00` is already off-peak.
- Period changes (`12:00` / `14:00` / `18:00`) are reflected within half a minute.

Default schedule:

| Days | Time | Shows |
| --- | --- | --- |
| Mon-Fri | 09:00 – 11:59 | 峰 / Peak |
| Mon-Fri | 12:00 – 13:59 | 谷 / Off-peak |
| Mon-Fri | 14:00 – 17:59 | 峰 / Peak |
| Mon-Fri | 18:00 – next 08:59 | 谷 / Off-peak |
| Sat, Sun | all day | 谷 / Off-peak |

The windows are plain constants in the source, so re-targeting them takes one edit — see "Customizing".

## UI language (Chinese / English)

The badge ships both wordings. Open `lib/client.js` and edit the constant near the top of the file:

```js
const LANG = "auto";
```

| `LANG` value | What the badge shows |
| --- | --- |
| `"auto"` (default) | Chinese when the browser language starts with `zh`, English for every other language |
| `"zh"` | Always Chinese: `工作时间：峰` / `工作时间：谷` |
| `"en"` | Always English: `Work hours: Peak` / `Work hours: Off-peak` |

With English text the badge renders `Work hours: ` followed by a bold **Peak** or **Off-peak**, and the hover tooltip switches to English as well.

## Installation

### From GitHub (recommended)

```bash
dsh plugin --profile web add github:banana770/dsh-work-badge
```

### From a local checkout

```bash
dsh plugin --profile web add /path/to/dsh-work-badge
```

After installing, reload the DSH UI (restart DSH or refresh the page with Ctrl+R) and the badge appears in the top-left corner, below the menu bar.

### Manual installation

The plugin is small — four files matter:

```text
package.json       manifest: declares the client entry (dsh.client) and the bundle patch
cordis.patch.yml   mounts the plugin into the profile's bundle roster (insert: work-badge)
lib/index.js       host half: an empty no-op that keeps the loader entry alive
lib/client.js      the real logic: registers the top-left label into the shell.overlay slot
```

Drop the whole directory into the profile's install location and make sure the `insert` entry in
`cordis.patch.yml` (`id: work-badge`, `name: dsh-work-badge`) is active. There is no build step.

## Uninstalling

Remove `dsh-work-badge` from the **Installed** list on the sidebar **Plugins** page (the remove action on the component row), then reload the UI. For a manual install, delete the matching `insert` entry from `cordis.patch.yml` and restart DSH.

## Customizing

| What you want to change | Where |
| --- | --- |
| The peak windows | `lib/client.js` → the `9 * 60` / `12 * 60` / `14 * 60` / `18 * 60` values in `isPeakHour()` |
| UI language | `const LANG = "auto";` at the top of `lib/client.js` |
| Wording | the `TEXT` object in `lib/client.js` (one Chinese and one English set) |
| Refresh interval | `TICK_MS` in `lib/client.js` (30 seconds by default) |
| Position, size, colors | `top` / `left` / `fontSize` and the CSS variables inside `WorkBadge()` |

## Refresh cost

The badge recomputes in exactly three situations: on mount, when the browser tab becomes visible again, and once every **30 seconds**. It costs essentially nothing, a period switch lags at most half a minute, and a tab that spent a long time in the background corrects itself the moment you return to it.

## Privacy

- **Local computation only**: system clock arithmetic only. No network calls, no telemetry, no data leaves the machine.
- **No file access**, and no contact with conversation content, model configuration, or credentials.
- **No API keys** are included in or needed by this plugin.
- It adds one read-only, `pointer-events: none` label to the UI and touches nothing else in DSH.

## Compatibility

- Targets the DSH **web** profile (`platform: "web"`); verified running on DSH desktop `0.4.2` (the label automatically avoids the Windows menu bar).
- Depends on the DSH `shell.overlay` client slot and on the `react` that DSH itself provides (declared as `peerDependencies: ^18.2.0`, so a second copy is never installed).
- Zero host-side dependencies: `lib/index.js` is an empty plugin.
- No build step: `lib/client.js` is the final, directly mountable bundle.

## License

[MIT](./LICENSE) — use, modify and redistribute freely.
