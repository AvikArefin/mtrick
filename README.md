# mtrick: Metrics Tracker
A local-first simple ML experiment tracker with zero configurations required.

![Dashboard Interface](https://raw.githubusercontent.com/AvikArefin/mtrick/main/interface.png)

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

Code:
```python
from mtrick import Tracker
t = Tracker("exp")
t.log({"loss": 0.1}, epoch=1)
```

Group with `/`:
```python
t.log({"loss/train": 0.1, "loss/val": 0.2}, epoch=1)
```

Confusion Matrix:
```python
t.log_confusion_matrix([[9, 1], [2, 8]], ["Cat", "Dog"])
```

Real vs Pred:
```python
t.log_trajectory([[1.0, 2.0]], [[1.1, 1.9]])
```

UI:
```bash
uv run mtrick
```

## Changelog
[See CHANGELOG.md](https://github.com/AvikArefin/mtrick/blob/main/CHANGELOG.md)
