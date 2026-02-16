import { describe, it, expect } from "vitest";

describe("Railway API Connection", () => {
  it("should connect to production API server", async () => {
    const apiUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
    expect(apiUrl).toBe("https://ravishing-smile-production.up.railway.app");

    // Test that the API server is reachable
    const response = await fetch(`${apiUrl}/api/health`);
    expect(response.ok).toBe(true);
  });
});
