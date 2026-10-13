# mtrick: Metrics Tracker
A local simple ML experiment tracker with zero configurations required.

Best used with https://pypi.org/project/xscope/ visualizer

## Installation

```
uv add mtrick
```
or 
```
pip install mtrick
```


If you want the latest version

```
uv add git+https://github.com/AvikArefin/mtrick.git
```
or 

```bash
pip install git+https://github.com/AvikArefin/mtrick.git
```

## Usage

Initialize tracker:
```python
from mtrick import Tracker
t = Tracker("exp_name")
```

Save hyperparameters (written to `config.json`; nested dicts become `a.b` keys) and, optionally, log
process/GPU memory with every `log()` call:
```python
t = Tracker("exp_name", config={"lr": 1e-3, "optim": {"name": "adam"}}, system_metrics=True)
```

Group runs that belong together, e.g. by model version. The group prefixes the run directory
(`metrics/v3_exp005_exp_name_20261014_103000`), so a version's runs sit together, and is saved in `meta.json`:
```python
t = Tracker("exp_name", group="v3")
```

A run refuses to start unless all code is committed, so the commit in `meta.json` is exactly the code that ran
(files under the metrics directory don't count). To track anyway, e.g. in a notebook or outside a git repository:
```python
t = Tracker("exp_name", require_clean=False)   # a commit with uncommitted changes is saved as "abc1234*"
```

Run status is recorded automatically in `status.json` (`running` → `finished`, `crashed` with the error, or
`interrupted`). In notebooks, where the process keeps running, mark the end yourself:
```python
with Tracker("exp_name") as t:   # or call t.finish() when done
    ...
```

Scalar metrics (epoch-based curves):
```python
t.log({"loss/train": 0.1, "loss/val": 0.2, "accuracy": 0.95}, epoch=1)
```

Text, e.g. sample predictions (written to `text.jsonl`):
```python
t.log_text({"Good-bye": "bood-bee"}, epoch=1)   # {what it should read: what the model read}
```

2D Spatial Points & Trajectories:
```python
t.log_2d(
    data={
        "data/true": [[1.0, 2.0], [2.0, 3.0]],
        "data/pred": [[1.1, 1.9], [2.1, 3.1]],
    },
    epoch=1
)
```

Matrices (Confusion Matrix):
```python
t.log_matrix(
    matrix=[[9, 1], [2, 8]],
    labels=["Cat", "Dog"],
    step=1
)
```

Calibration (stores a 10-bin reliability histogram, not the raw predictions):
```python
probs = logits.softmax(-1)
t.log_calibration(
    confidences=probs.max(-1).values,          # confidence of each prediction
    correct=probs.argmax(-1) == targets,       # whether it was right
    step=1
)
```

Every record also gets a `_time` wall-clock timestamp, which xscope uses to detect slowdowns and stalled runs.

## Changelog
[See CHANGELOG.md](https://github.com/AvikArefin/mtrick/blob/main/CHANGELOG.md)

## Presented by Cortex Technologies

`mtrick` is presented by [Cortex Technologies](https://cortextech.dev), the engineering studio built to take your products from idea to device. Cortex brings together Machine Vision, Hardware, and AIoT embedded systems expertise to turn concepts into 'works-like' MVP prototype devices.

