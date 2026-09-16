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