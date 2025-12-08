# motion/filters.py

class IIRFilter:
    def __init__(self, b_coeffs, a_coeffs):
        self.b = b_coeffs
        self.a = a_coeffs
        self.x = [0] * len(b_coeffs)
        self.y = [0] * len(a_coeffs)

    def update(self, input_val):
        self.x = [input_val] + self.x[:-1]
        y_new = sum(b*x for b, x in zip(self.b, self.x))
        y_new -= sum(a*y for a, y in zip(self.a[1:], self.y[:-1]))
        y_new /= self.a[0]
        self.y = [y_new] + self.y[:-1]
        return y_new


class KalmanFilter1D:
    def __init__(self, q, r):
        self.q = q  # Process noise
        self.r = r  # Measurement noise
        self.x = 0  # Estimate
        self.p = 1  # Error covariance

    def update(self, measurement, accurate):
        if accurate:
            # Prediction update
            self.p += self.q
            # Measurement update
            k = self.p / (self.p + self.r)
            self.x += k * (measurement - self.x)
            self.p *= (1 - k)

    def predict(self):
        return self.x