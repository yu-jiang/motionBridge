import librosa

AUDIO_DIR = "public/audios/"

y, sr = librosa.load(AUDIO_DIR + "random-mp3.mp3")

tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)

print(f"Estimated tempo: {tempo} BPM")

beat_times = librosa.frames_to_time(beat_frames, sr=sr)
print("Beat times (in seconds):", beat_times)