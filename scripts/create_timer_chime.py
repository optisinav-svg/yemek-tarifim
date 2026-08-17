import math
import wave
from pathlib import Path

sample_rate = 44100
segments = [(880, 0.18), (0, 0.08), (988, 0.18), (0, 0.08), (1175, 0.32)]
frames = bytearray()
for frequency, duration in segments:
    count = int(sample_rate * duration)
    for index in range(count):
        if frequency == 0:
            value = 0
        else:
            envelope = min(1.0, index / (sample_rate * 0.012), (count - index) / (sample_rate * 0.04))
            value = int(0.28 * 32767 * envelope * math.sin(2 * math.pi * frequency * index / sample_rate))
        frames.extend(value.to_bytes(2, byteorder="little", signed=True))

output = Path(__file__).resolve().parents[1] / "assets" / "audio" / "timer-complete.wav"
output.parent.mkdir(parents=True, exist_ok=True)
with wave.open(str(output), "wb") as wav:
    wav.setnchannels(1)
    wav.setsampwidth(2)
    wav.setframerate(sample_rate)
    wav.writeframes(frames)
print(output)
