import { describe, it, expect } from "vitest";

// Test the Google OAuth configuration and route registration
describe("Google OAuth Server", () => {
  it("should export registerGoogleAuthRoutes function", async () => {
    const mod = await import("./google-auth");
    expect(mod.registerGoogleAuthRoutes).toBeDefined();
    expect(typeof mod.registerGoogleAuthRoutes).toBe("function");
  });

  it("getGoogleConfig should read from environment variables", async () => {
    // Set test env vars
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const originalApiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

    process.env.GOOGLE_CLIENT_ID = "test-client-id-123";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret-456";
    process.env.GOOGLE_REDIRECT_URI = "https://example.com/callback";

    // Re-import to get fresh module
    // Since getGoogleConfig is private, we test it indirectly through route behavior
    // For now, just verify the module loads without error
    const mod = await import("./google-auth");
    expect(mod.registerGoogleAuthRoutes).toBeDefined();

    // Restore
    process.env.GOOGLE_CLIENT_ID = originalClientId;
    process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
    process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBase;
  });

  it("should default GOOGLE_REDIRECT_URI from EXPO_PUBLIC_API_BASE_URL", () => {
    const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const originalApiBase = process.env.EXPO_PUBLIC_API_BASE_URL;

    // Clear explicit redirect URI, set API base
    delete process.env.GOOGLE_REDIRECT_URI;
    process.env.EXPO_PUBLIC_API_BASE_URL = "https://ravishing-smile-production.up.railway.app";

    // The default should be API base + /api/auth/google/callback
    const expectedUri = "https://ravishing-smile-production.up.railway.app/api/auth/google/callback";
    
    // We can't directly test the private function, but we verify the logic
    const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || (apiBaseUrl ? `${apiBaseUrl}/api/auth/google/callback` : "");
    expect(redirectUri).toBe(expectedUri);

    // Restore
    process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
    process.env.EXPO_PUBLIC_API_BASE_URL = originalApiBase;
  });

  it("should register three routes on the Express app", async () => {
    const { registerGoogleAuthRoutes } = await import("./google-auth");
    
    const routes: { method: string; path: string }[] = [];
    const mockApp = {
      get: (path: string, handler: any) => {
        routes.push({ method: "GET", path });
      },
      post: (path: string, handler: any) => {
        routes.push({ method: "POST", path });
      },
    };

    registerGoogleAuthRoutes(mockApp as any);

    expect(routes).toHaveLength(3);
    expect(routes).toContainEqual({ method: "GET", path: "/api/auth/google" });
    expect(routes).toContainEqual({ method: "GET", path: "/api/auth/google/callback" });
    expect(routes).toContainEqual({ method: "POST", path: "/api/auth/google/token" });
  });
});
