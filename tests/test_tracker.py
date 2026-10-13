import json
import os
import subprocess
import sys
import textwrap

import pytest

from mtrick import Tracker


def read_jsonl(path):
    with open(path) as f:
        return [json.loads(line) for line in f]


def read_json(path):
    with open(path) as f:
        return json.load(f)


def only_run_dir(save_path):
    (name,) = [d for d in os.listdir(save_path) if d.startswith("exp")]
    return os.path.join(save_path, name)


def test_records_get_timestamps(tmp_path):
    t = Tracker("ts", save_path=str(tmp_path), require_clean=False)
    t.log({"loss": 1.0}, epoch=1)
    t.log_2d({"a/true": [[0, 0]]}, epoch=1)
    t.log_matrix([[1, 0], [0, 1]], step=1)
    for name in ("metrics.jsonl", "2d.jsonl", "matrix.jsonl"):
        (record,) = read_jsonl(os.path.join(t.experiment_dir, name))
        assert record["_time"] >= t.start_time
    t.finish()


def test_config_is_flattened(tmp_path):
    t = Tracker("cfg", save_path=str(tmp_path), require_clean=False, config={"lr": 0.1, "optim": {"name": "adam", "betas": [0.9, 0.99]}})
    assert read_json(os.path.join(t.experiment_dir, "config.json")) == {
        "lr": 0.1, "optim.name": "adam", "optim.betas": [0.9, 0.99]}
    t.finish()


def test_non_numeric_metric_does_not_crash(tmp_path):
    t = Tracker("str", save_path=str(tmp_path), require_clean=False)
    t.log({"loss": 0.5, "phase": "warmup"}, epoch=1)
    t.finish()


def test_system_metrics_opt_in(tmp_path):
    t = Tracker("sys", save_path=str(tmp_path), require_clean=False, system_metrics=True)
    t.log({"loss": 1.0}, epoch=1)
    (record,) = read_jsonl(os.path.join(t.experiment_dir, "metrics.jsonl"))
    if sys.platform != "win32":
        assert record["sys/peak_rss_gb"] > 0
    t.finish()


def test_context_manager_marks_status(tmp_path):
    with Tracker("ok", save_path=str(tmp_path), require_clean=False) as t:
        assert read_json(os.path.join(t.experiment_dir, "status.json"))["status"] == "running"
    assert read_json(os.path.join(t.experiment_dir, "status.json"))["status"] == "finished"

    with pytest.raises(ValueError):
        with Tracker("bad", save_path=str(tmp_path), require_clean=False) as t2:
            raise ValueError("boom")
    status = read_json(os.path.join(t2.experiment_dir, "status.json"))
    assert status["status"] == "crashed" and status["error"] == "ValueError: boom"


@pytest.mark.parametrize("body, expected", [
    ("pass", "finished"),
    ("raise RuntimeError('CUDA out of memory')", "crashed"),
    ("raise KeyboardInterrupt", "interrupted"),
])
def test_status_written_at_process_exit(tmp_path, body, expected):
    script = textwrap.dedent(f"""
        from mtrick import Tracker
        t = Tracker("proc", save_path={str(tmp_path)!r}, require_clean=False)
        t.log({{"loss": 1.0}}, epoch=1)
        {body}
    """)
    subprocess.run([sys.executable, "-c", script], capture_output=True)
    status = read_json(os.path.join(only_run_dir(tmp_path), "status.json"))
    assert status["status"] == expected
    if expected == "crashed":
        assert "CUDA out of memory" in status["error"]


def test_log_calibration_bins(tmp_path):
    t = Tracker("cal", save_path=str(tmp_path), require_clean=False)
    t.log_calibration([0.95, 0.95, 0.15, 0.55], [1, 0, 0, 1], step=3, bins=10)
    (record,) = read_jsonl(os.path.join(t.experiment_dir, "calibration.jsonl"))
    assert record["step"] == 3
    assert record["bins"] == [
        {"count": 1, "confidence": 0.15, "accuracy": 0.0},
        {"count": 1, "confidence": 0.55, "accuracy": 1.0},
        {"count": 2, "confidence": 0.95, "accuracy": 0.5},
    ]
    with pytest.raises(ValueError):
        t.log_calibration([0.5], [1, 0])
    t.finish()


def test_log_accepts_numpy_like_scalars(tmp_path):
    class Scalar:   # stands in for a 0-d torch tensor or a numpy float
        def item(self):
            return 0.25

    t = Tracker("scalar", save_path=str(tmp_path), require_clean=False)
    t.log({"loss": Scalar(), "exact": 3}, epoch=0)
    (record,) = read_jsonl(os.path.join(t.experiment_dir, "metrics.jsonl"))
    assert record["loss"] == 0.25 and record["exact"] == 3
    t.finish()


def test_log_text(tmp_path, capsys):
    t = Tracker("text", save_path=str(tmp_path), require_clean=False)
    t.log_text({"Good-bye": "bood-bee "}, epoch=4)
    (record,) = read_jsonl(os.path.join(t.experiment_dir, "text.jsonl"))
    assert record["epoch"] == 4 and record["Good-bye"] == "bood-bee " and "_time" in record
    assert "Good-bye: 'bood-bee '" in capsys.readouterr().out
    t.finish()


def test_group_prefixes_the_run_directory(tmp_path):
    first = Tracker("100", save_path=str(tmp_path), require_clean=False, group="v3")
    second = Tracker("100", save_path=str(tmp_path), require_clean=False)
    third = Tracker("20", save_path=str(tmp_path), require_clean=False, group="v4")
    assert os.path.basename(first.experiment_dir).startswith("v3_exp001_100_")
    assert os.path.basename(second.experiment_dir).startswith("exp002_100_")   # numbers run across groups
    assert os.path.basename(third.experiment_dir).startswith("v4_exp003_20_")
    assert read_json(os.path.join(first.experiment_dir, "meta.json"))["group"] == "v3"
    assert "group" not in read_json(os.path.join(second.experiment_dir, "meta.json"))
    with pytest.raises(ValueError):
        Tracker("bad", save_path=str(tmp_path), require_clean=False, group="v3_big")
    for t in (first, second, third):
        t.finish()


@pytest.fixture
def repo(tmp_path, monkeypatch):
    """A git repository with one committed file, as the working directory."""
    def git(*args):
        subprocess.run(["git", "-c", "user.name=t", "-c", "user.email=t@t", *args], cwd=tmp_path, check=True,
                       capture_output=True)
    git("init")
    (tmp_path / "train.py").write_text("lr = 0.1\n")
    git("add", "train.py")
    git("commit", "-m", "init")
    monkeypatch.chdir(tmp_path)
    return tmp_path


def test_require_clean(repo):
    first = Tracker("clean")
    first.log({"loss": 1.0}, epoch=0)
    first.finish()
    assert not first.git_commit.endswith("*")

    # the first run's own files under metrics/ don't make the next run dirty
    second = Tracker("still_clean")
    second.finish()

    (repo / "train.py").write_text("lr = 0.2\n")
    with pytest.raises(RuntimeError, match="commit your changes first"):
        Tracker("dirty")
    assert Tracker("dirty_allowed", require_clean=False).git_commit.endswith("*")

    (repo / "train.py").write_text("lr = 0.1\n")
    (repo / "new_model.py").write_text("")   # untracked code counts too
    with pytest.raises(RuntimeError, match="commit your changes first"):
        Tracker("untracked")


def test_require_clean_outside_git(tmp_path, monkeypatch):
    monkeypatch.chdir(tmp_path)
    monkeypatch.setenv("GIT_CEILING_DIRECTORIES", str(tmp_path.parent))
    with pytest.raises(RuntimeError, match="not in a git repository"):
        Tracker("nogit")
