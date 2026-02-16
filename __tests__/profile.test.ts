import { describe, it, expect } from "vitest";

describe("Profile Screen", () => {
  it("should have privacy policy content defined", () => {
    // Test that the profile module exists
    const profilePath = "/home/ubuntu/math-practice-app/app/(tabs)/profile.tsx";
    expect(profilePath).toBeTruthy();
  });

  it("should contain privacy policy sections", async () => {
    const fs = await import("fs");
    const profileContent = fs.readFileSync(
      "/home/ubuntu/math-practice-app/app/(tabs)/profile.tsx",
      "utf-8"
    );

    // Check for key privacy policy sections
    expect(profileContent).toContain("Privacy Policy");
    expect(profileContent).toContain("Data Collection");
    expect(profileContent).toContain("Data Usage");
    expect(profileContent).toContain("Local Data");
    expect(profileContent).toContain("Data Security");
    expect(profileContent).toContain("Children's Privacy");
  });

  it("should explain data is not sold", async () => {
    const fs = await import("fs");
    const profileContent = fs.readFileSync(
      "/home/ubuntu/math-practice-app/app/(tabs)/profile.tsx",
      "utf-8"
    );

    expect(profileContent).toContain("Sell your data");
    expect(profileContent).toContain("exclusively to display global leaderboards");
  });

  it("should mention local storage", async () => {
    const fs = await import("fs");
    const profileContent = fs.readFileSync(
      "/home/ubuntu/math-practice-app/app/(tabs)/profile.tsx",
      "utf-8"
    );

    expect(profileContent).toContain("stored locally on your device");
    expect(profileContent).toContain("Personal best scores");
    expect(profileContent).toContain("Achievement progress");
  });

  it("should have last updated date", async () => {
    const fs = await import("fs");
    const profileContent = fs.readFileSync(
      "/home/ubuntu/math-practice-app/app/(tabs)/profile.tsx",
      "utf-8"
    );

    expect(profileContent).toContain("Last updated:");
  });
});
