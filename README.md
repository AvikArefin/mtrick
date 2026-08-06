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

Scalar metrics (epoch-based curves):
```python
t.log({"loss/train": 0.1, "loss/val": 0.2, "accuracy": 0.95}, epoch=1)
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

## Changelog
[See CHANGELOG.md](https://github.com/AvikArefin/mtrick/blob/main/CHANGELOG.md)
