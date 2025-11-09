from sklearn.linear_model import LinearRegression
import numpy as np
import json

def generate_training_data():

    X = []
    Y = []

    for dataset_id in range(10):
        for day in range(30):
            for hour in range(24):
                # Simulate realistic patterns
                is_weekend = day % 7 >= 5
                is_business_hours = 9 <= hour <= 17

                features = [
                    day % 7,  # day of week
                    hour,     # hour of day
                    np.random.choice([10, 50, 200, 1000]),  # size in GB
                    np.random.poisson(50)  # last 7d access (average 50)
                ]

                # Next week access = f(current_access, time_patterns) + noise
                base_access = features[3]  # last 7d
                time_multiplier = 1.5 if (is_weekend and is_business_hours) else 1.0
                noise = np.random.normal(0, 5)

                target = max(0, base_access * time_multiplier + noise)

                X.append(features)
                Y.append(target)

    return np.array(X), np.array(Y)

def train_model():
    X, y = generate_training_data()
    model = LinearRegression()
    model.fit(X, y)
    return model

def predict_for_dataset(dataset_id: str, access_count_7d: int, size_gb: int):
    model = train_model()

    import datetime
    now = datetime.datetime.now()
    features = np.array([
        now.weekday(),  # day of week
        now.hour,       # hour
        size_gb,
        access_count_7d
    ]).reshape(1, -1)

    prediction = model.predict(features)[0]

    return {
        "datasetId": dataset_id,
        "predictedAccessNext7d": round(prediction, 2),
        "confidence": "high" if access_count_7d > 50 else "medium",
        "modelScore": round(model.score(*generate_training_data()), 3)
    }

if __name__ == "__main__":
    result = predict_for_dataset(
        dataset_id="api-logs",
        access_count_7d=80,
        size_gb=100
    )

    print(json.dumps(result, indent=2))

    predictions = {
        "dataset_001": predict_for_dataset("dataset_001", 45, 50),
        "dataset_002": predict_for_dataset("dataset_002", 120, 300),
        "dataset_003": predict_for_dataset("dataset_003", 0, 500)
    }

    with open('src/predictions.json', 'w') as f:
        json.dump(predictions, f, indent=2)
