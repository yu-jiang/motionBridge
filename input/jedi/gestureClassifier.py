import json
import numpy as np
from pathlib import Path

probThreshold = 0.95

# Load gesture labels from labels.json
with open('frontend/public/jedi/labels.json', 'r') as f:
    gesture_labels = json.load(f)

class GestureClassifier:
    def __init__(self, input_size, num_classes, weights):
        self.input_size = input_size
        self.num_classes = num_classes
        
        # Load weights from dictionary
        self.fc1_weight = weights['fc1.weight'].astype(np.float32)
        self.fc1_bias = weights['fc1.bias'].astype(np.float32)
        self.fc2_weight = weights['fc2.weight'].astype(np.float32)
        self.fc2_bias = weights['fc2.bias'].astype(np.float32)
        self.fc3_weight = weights['fc3.weight'].astype(np.float32)
        self.fc3_bias = weights['fc3.bias'].astype(np.float32)

    def relu(self, x):
        return np.maximum(0, x)
    
    def forward(self, x):
        # Layer 1: fc1 + ReLU
        x = np.dot(x, self.fc1_weight.T) + self.fc1_bias
        x = self.relu(x)
        # Layer 2: fc2 + ReLU
        x = np.dot(x, self.fc2_weight.T) + self.fc2_bias
        x = self.relu(x)
        # Layer 3: fc3
        x = np.dot(x, self.fc3_weight.T) + self.fc3_bias
        return x
    
    def predict(self, input_tensor):
        # Ensure input is a NumPy array
        input_tensor = np.array(input_tensor, dtype=np.float32)
        # Run forward pass
        output = self.forward(input_tensor)
        # Apply softmax for probabilities
        exp_output = np.exp(output - np.max(output, axis=-1, keepdims=True))
        probabilities = exp_output / np.sum(exp_output, axis=-1, keepdims=True)
        # Return class with highest probability
        return np.argmax(probabilities, axis=-1)[0]

    def infer(self, input_tensor, model_type):
        # Ensure input is a NumPy array
        input_tensor = np.array(input_tensor, dtype=np.float32)
        # Run forward pass
        output = self.forward(input_tensor)
        # Apply softmax for probabilities
        exp_output = np.exp(output - np.max(output, axis=-1, keepdims=True))
        probabilities = exp_output / np.sum(exp_output, axis=-1, keepdims=True)
        prediction = np.argmax(probabilities, axis=-1)[0]
        maxProb    = probabilities[0, prediction]

        if maxProb > probThreshold:
            predicted_label = gesture_labels[model_type][prediction]
        else:
            predicted_label = 'none'

        return predicted_label

def load_models():
    """Load trained models for hand, pose, and face."""
    base_dir = Path("input/jedi/models")
    models = {}
    for model_type, input_size in [('hand', 63), ('pose', 26), ('face', 1434)]:
        try:
            model_path = base_dir / f'{model_type}_model_weights.npy'
            weights = np.load(model_path, allow_pickle=True).item()
            num_classes = len(gesture_labels[model_type])
            models[model_type] = GestureClassifier(input_size, num_classes, weights)
            print(f"Loaded {model_type}_model_weights.npy")
        except FileNotFoundError:
            print(f"Warning: {model_type}_model_weights.npy not found. Model will not be used.")
        except Exception as e:
            print(f"Error loading {model_type}_model_weights.npy: {e}")
    return models