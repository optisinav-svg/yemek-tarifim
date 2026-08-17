from __future__ import annotations

import math
import random
import struct
import wave

SAMPLE_RATE = 44_100
DURATION_SECONDS = 20
OUTPUT = "/home/ubuntu/yemek-tarifim/assets/audio/timer-alarm.wav"

random.seed(20260817)

def clamp(value: float, low: float = -1.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def tone(t: float, freq: float, duration: float, phase: float = 0.0) -> float:
    if t < 0.0 or t >= duration:
        return 0.0
    fade = min(1.0, t / 0.025, (duration - t) / 0.045)
    wobble = 1.0 + 0.018 * math.sin(2.0 * math.pi * 6.0 * t)
    f = freq * wobble
    fundamental = math.sin(2.0 * math.pi * f * t + phase)
    harmonic_2 = 0.45 * math.sin(2.0 * math.pi * (2.01 * f) * t + phase * 0.7)
    harmonic_3 = 0.28 * math.sin(2.0 * math.pi * (3.02 * f) * t + phase * 1.3)
    harmonic_5 = 0.15 * math.sin(2.0 * math.pi * (5.01 * f) * t + phase * 0.4)
    buzz = math.tanh(1.55 * (fundamental + harmonic_2 + harmonic_3 + harmonic_5))
    return fade * buzz


def make_sample(index: int) -> int:
    t = index / SAMPLE_RATE
    cycle = t % 2.0
    sample = 0.0

    # Alternating sustained buzzer and short horn-like pulses, leaving a short gap.
    if 0.08 <= cycle < 0.80:
        local = cycle - 0.08
        sample += 0.72 * tone(local, 740.0, 0.72, 0.2)
        sample += 0.28 * tone(local, 1110.0, 0.72, 1.0)
    elif 0.98 <= cycle < 1.26:
        local = cycle - 0.98
        sample += 0.86 * tone(local, 520.0, 0.28, 0.6)
        sample += 0.22 * tone(local, 780.0, 0.28, 1.8)
    elif 1.38 <= cycle < 1.66:
        local = cycle - 1.38
        sample += 0.86 * tone(local, 520.0, 0.28, 2.2)
        sample += 0.22 * tone(local, 780.0, 0.28, 2.7)

    # A very low noise bed gives the alarm a tactile, raspy edge without masking speech.
    if sample:
        sample += 0.018 * (random.random() * 2.0 - 1.0)

    # Soft saturation and peak normalization for a strong but unclipped WAV.
    sample = math.tanh(1.15 * sample) / math.tanh(1.15)
    return int(clamp(sample) * 32767)


with wave.open(OUTPUT, "wb") as audio:
    audio.setnchannels(1)
    audio.setsampwidth(2)
    audio.setframerate(SAMPLE_RATE)
    frames = bytearray()
    for index in range(SAMPLE_RATE * DURATION_SECONDS):
        frames.extend(struct.pack("<h", make_sample(index)))
    audio.writeframes(frames)

print(f"Created {OUTPUT} ({DURATION_SECONDS}s mono WAV at {SAMPLE_RATE} Hz)")
