# 0.8.0

- Feat: `Tracker(config=...)` saves hyperparameters to `config.json` (nested dicts flattened to `a.b` keys)
- Feat: run status in `status.json`: `running`, then `finished`, `crashed` (with the error message) or `interrupted`; set automatically at exit, or via `finish()` / `with Tracker(...)`
- Feat: every record gets a `_time` wall-clock timestamp
- Feat: `Tracker(system_metrics=True)` logs `sys/peak_rss_gb` (and `sys/gpu_mem_gb` when torch with CUDA is in use), with no new dependencies
- Feat: `log_calibration(confidences, correct, step)` stores a reliability histogram for calibration diagnostics
- Feat: `Tracker(group=...)` prefixes the run directory with the group (`v3_exp005_name_...`) and saves it in `meta.json`
- Breaking: a run refuses to start with uncommitted changes or outside a git repository; pass
  `Tracker(require_clean=False)` for the old behaviour
- Feat: `log_text(texts, epoch)` stores short pieces of text (e.g. sample predictions) in `text.jsonl`
- Fix: `log()` no longer crashes on non-numeric values
- Fix: `log()` no longer crashes on 0-d tensors and numpy scalars; whole numbers are printed without decimals
- Fix: files under the metrics directory no longer mark a run's commit as dirty (`*`)
- Fix: `finish()` puts back the exception hook it replaced
- Fix: git's "not a git repository" message is no longer printed outside git repos

# 0.7.0

- Feat: `Tracker(note=...)` saves the note as `note.txt` in the run directory

# 0.6.2

- Chore: Add Cortex Technologies attribution to the README
- Chore: Remove the outdated upgrade-contact notice

# 0.6.1

- Fix: Correct PyPI package classifiers
- Docs: Update installation guidance in the README

# 0.6.0

Please use `xscope` mtrick. uv add xscope | https://pypi.org/project/xscope/
`mtrick` is now a logging only library and `xscope` is visualization only tool

- Breaking: Remove dashboard web UI and CLI entrypoint (mtrick is now a logging-only library)
- Breaking: Remove deprecated `log_trajectory` and `log_confusion_matrix` methods from `Tracker`

# 0.5.0
- Feat: high res png and svg export with color and aspect ratio edit 
- Regress: Change plot color [temporary] introduced in 0.3.0

# 0.4.0
- Feat: live update (polling)

# 0.3.0
- Feat: Change font family
- Feat: Change plot color [temporary]
- QOL: Hide / Unhide side bar
- QOL: Dark Mode and Light Mode

# 0.2.0
- Feat: add editable per-run note and update UI components

# 0.1.5
- Fix: Single select correctly selects single experiment and only selecting checkbox will do multi-select

# 0.1.4
- Chore: introduce verbose flag
- Chore: pretty print runs on verbose flag

# 0.1.3
- Fix: logging to be formatted

# 0.1.2
- Fix: Use absolute GitHub URLs in README.

# 0.1.1
- Fix: Render trajectory graph.
- Fix: Fix interface.png in README.
- Doc: Add usage examples.