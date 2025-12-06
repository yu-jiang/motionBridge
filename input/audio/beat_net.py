from BeatNet.BeatNet import BeatNet

estimator = BeatNet(1, mode='stream', inference_model='PF', plot=[], thread=False)

Output = estimator.process()