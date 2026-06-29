import time
import math
import random
from mtrick import Tracker

def main():
    # 1. Initialize the tracker
    # This automatically creates a new run directory inside 'metrics'
    print("Initializing Tracker...")
    tracker = Tracker(experiment_name="demo_run", save_path="metrics")

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

    # 3. Simulate and log a real vs pred trajectory
    print("Logging a real vs pred trajectory...")
    real_path = [[float(i), float(i * 1.5)] for i in range(10)]
    pred_path = [[float(i), float(i * 1.5 + random.uniform(-0.5, 0.5))] for i in range(10)]
    tracker.log_trajectory(true_data=real_path, pred_data=pred_path)

    # 4. Simulate and log a confusion matrix
    print("Logging a confusion matrix...")
    classes = ["Cat", "Dog", "Bird"]
    # 3x3 confusion matrix
    matrix = [
        [15, 2, 1],  # True Cats
        [3, 18, 0],  # True Dogs
        [1, 2, 12],  # True Birds
    ]
    tracker.log_confusion_matrix(matrix, classes=classes)

    print("\nExperiment tracking complete! Run directory created inside 'metrics'.")
    print("You can now launch the dashboard to visualize this run.")

if __name__ == "__main__":
    main()
