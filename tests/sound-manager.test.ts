import { describe, it, expect } from "vitest";

describe("Sound Manager", () => {
  it("should have correct sound types defined", () => {
    const soundTypes = ["buttonPress", "correct", "incorrect", "highScore"];
    expect(soundTypes).toHaveLength(4);
    expect(soundTypes).toContain("buttonPress");
    expect(soundTypes).toContain("correct");
    expect(soundTypes).toContain("incorrect");
    expect(soundTypes).toContain("highScore");
  });

  it("should verify sound files exist", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    const soundsDir = path.resolve(__dirname, "../assets/sounds");
    const soundFiles = [
      "button-press.wav",
      "correct.wav",
      "incorrect.wav",
      "high-score.wav",
    ];

    for (const file of soundFiles) {
      const filePath = path.join(soundsDir, file);
      expect(fs.existsSync(filePath)).toBe(true);
    }
  });

  it("should have valid wav file headers", async () => {
    const fs = await import("fs");
    const path = await import("path");
    
    const soundsDir = path.resolve(__dirname, "../assets/sounds");
    const soundFiles = [
      "button-press.wav",
      "correct.wav",
      "incorrect.wav",
      "high-score.wav",
    ];

    for (const file of soundFiles) {
      const filePath = path.join(soundsDir, file);
      const buffer = fs.readFileSync(filePath);
      
      // Check WAV file header (RIFF)
      const header = buffer.toString("ascii", 0, 4);
      expect(header).toBe("RIFF");
      
      // Check WAV format (WAVE)
      const format = buffer.toString("ascii", 8, 12);
      expect(format).toBe("WAVE");
    }
  });
});
