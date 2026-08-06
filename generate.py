import time
import math
import random
from mtrick import Tracker

def main():
    # 1. Initialize the tracker
    # This automatically creates a new run directory inside 'metrics'
    print("Initializing Tracker...")
    tracker = Tracker(experiment_name="demo_run")

    # 2. Simulate training loop and log metrics
    print("Simulating 50 epochs of training...")
    for epoch in range(1, 51):
        # Generate some synthetic training metrics
        train_loss = 0.5 * math.exp(-epoch / 15.0) + random.uniform(-0.02, 0.02)
        val_loss = 0.5 * math.exp(-epoch / 15.0) + 0.05 + random.uniform(-0.01, 0.01)
        accuracy = 1.0 - val_loss + random.uniform(-0.01, 0.01)

        # Log metrics for the current epoch
        tracker.log(
            metrics={
                "loss/train": max(0.0, train_loss),
                "loss/val": max(0.0, val_loss),
                "accuracy": min(1.0, max(0.0, accuracy)),
            },
            epoch=epoch
        )
        time.sleep(0.05)

    # 3. Simulate and log 2D spatial points over epochs
    print("Logging 2D spatial data over epochs...")
    for epoch in range(1, 11):
        real_path = [[float(i), float(i * 1.5)] for i in range(10)]
        pred_path = [[float(i), float(i * 1.5 + random.uniform(-0.5, 0.5))] for i in range(10)]
        initial_points = [[0.0, 0.0], [1.0, 0.5]]
        
        tracker.log_2d(
            data={
                "data/true": real_path,
                "data/pred": pred_path,
                "initial": initial_points,
            },
            epoch=epoch
        )

    # 4. Simulate and log matrix data (confusion matrix) over steps
    print("Logging matrix data over steps...")
    classes = ["Cat", "Dog", "Bird"]
    for step in range(10, 51, 10):
        # Generate synthetic confusion matrix with random values (higher diagonal counts)
        matrix = [
            [random.randint(25, 45), random.randint(0, 5), random.randint(0, 3)],
            [random.randint(0, 5), random.randint(25, 45), random.randint(0, 4)],
            [random.randint(0, 3), random.randint(0, 4), random.randint(25, 45)],
        ]
        tracker.log_matrix(matrix, labels=classes, step=step)

    print("You can now launch the dashboard to visualize this run.")

if __name__ == "__main__":
    main()
