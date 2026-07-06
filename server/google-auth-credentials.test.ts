import { describe, it, expect } from "vitest";

/**
 * Validate that Google OAuth credentials are properly configured
 * by hitting the local server's /api/auth/google endpoint.
 */
describe("Google OAuth Credentials Validation", () => {
  it("should return a valid Google auth URL when credentials are configured", async () => {
    // The dev server runs on port 3000
    const response = await fetch("http://127.0.0.1:3000/api/auth/google?platform=web");
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.url).toBeDefined();
    expect(data.url).toContain("https://accounts.google.com/o/oauth2/v2/auth");
    expect(data.url).toContain("client_id=");
    expect(data.url).toContain("redirect_uri=");
    expect(data.url).toContain("scope=openid");
    
    // Verify the URL contains a real client ID (not empty)
    const urlObj = new URL(data.url);
    const clientId = urlObj.searchParams.get("client_id");
    expect(clientId).toBeTruthy();
    expect(clientId!.length).toBeGreaterThan(10);
    expect(clientId).toContain(".apps.googleusercontent.com");
    
    console.log("[Test] Google OAuth URL generated successfully with client_id:", clientId?.substring(0, 20) + "...");
  });

  it("should include correct redirect URI in the auth URL", async () => {
    const response = await fetch("http://127.0.0.1:3000/api/auth/google?platform=web");
    const data = await response.json();
    
    const urlObj = new URL(data.url);
    const redirectUri = urlObj.searchParams.get("redirect_uri");
    
    expect(redirectUri).toBeTruthy();
    expect(redirectUri).toContain("/api/auth/google/callback");
    
    console.log("[Test] Redirect URI:", redirectUri);
  });
});
