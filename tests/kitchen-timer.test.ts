import { describe, expect, it } from "vitest";

import { formatTimer } from "../lib/kitchen-timer-utils";

describe("formatTimer", () => {
  it("formats minutes and seconds with two digits", () => {
    expect(formatTimer(305)).toBe("05:05");
  });

  it("clamps negative values to zero", () => {
    expect(formatTimer(-10)).toBe("00:00");
  });

  it("rounds fractional seconds for a stable countdown label", () => {
    expect(formatTimer(61.6)).toBe("01:02");
  });

  it("calculates 1 hour and custom minutes correctly", () => {
    const hours = 1;
    const minutes = 5;
    const totalSeconds = (hours * 3600) + (minutes * 60);
    expect(totalSeconds).toBe(3900);
    expect(formatTimer(totalSeconds)).toBe("65:00");
  });
});
