import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { sdk } from "./_core/sdk";
import { getUserByOpenId, upsertUser } from "./db";

/**
 * Google OAuth2 configuration.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars.
 * GOOGLE_REDIRECT_URI defaults to the Railway production callback URL.
 */
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";

function getGoogleConfig() {
  const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
  return {
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    // Default redirect URI: production Railway URL + /api/auth/google/callback
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      (apiBaseUrl ? `${apiBaseUrl}/api/auth/google/callback` : ""),
  };
}

/**
 * Exchange Google authorization code for access token
 */
async function exchangeGoogleCode(code: string, redirectUri: string) {
  const config = getGoogleConfig();
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("[Google Auth] Token exchange failed:", errorText);
    throw new Error(`Google token exchange failed: ${response.status}`);
  }

  return response.json() as Promise<{
    access_token: string;
    token_type: string;
    expires_in: number;
    id_token?: string;
    refresh_token?: string;
  }>;
}

/**
 * Get user info from Google using access token
 */
async function getGoogleUserInfo(accessToken: string) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Google userinfo request failed: ${response.status}`);
  }

  return response.json() as Promise<{
    id: string;
    email: string;
    verified_email: boolean;
    name: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
  }>;
}

/**
 * Build a user response object for the client (matches Manus OAuth format)
 */
function buildUserResponse(user: any) {
  return {
    id: user?.id ?? null,
    openId: user?.openId ?? null,
    name: user?.name ?? null,
    email: user?.email ?? null,
    loginMethod: user?.loginMethod ?? null,
    lastSignedIn: (user?.lastSignedIn ?? new Date()).toISOString(),
  };
}

export function registerGoogleAuthRoutes(app: Express) {
  /**
   * GET /api/auth/google
   * Initiates Google OAuth flow. Returns the Google consent URL.
   * Query params:
   *   - redirect_uri (optional): override for mobile deep link callback
   *   - platform: "web" | "mobile" to determine callback handling
   */
  app.get("/api/auth/google", (req: Request, res: Response) => {
    const config = getGoogleConfig();

    if (!config.clientId) {
      console.error("[Google Auth] GOOGLE_CLIENT_ID not configured");
      res.status(500).json({ error: "Google OAuth not configured. Set GOOGLE_CLIENT_ID env var." });
      return;
    }

    if (!config.redirectUri) {
      console.error("[Google Auth] GOOGLE_REDIRECT_URI not configured");
      res.status(500).json({ error: "Google OAuth redirect URI not configured." });
      return;
    }

    // For mobile, use the server callback which will redirect to the deep link
    // For web, use the server callback which will set a cookie and redirect
    const platform = (req.query.platform as string) || "web";
    const mobileRedirect = req.query.redirect_uri as string | undefined;

    // Build state to carry platform info and mobile redirect
    const statePayload = JSON.stringify({ platform, mobileRedirect });
    const state = Buffer.from(statePayload).toString("base64url");

    const redirectUri = config.redirectUri;

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      state,
      prompt: "select_account",
    });

    const authUrl = `${GOOGLE_AUTH_URL}?${params.toString()}`;
    res.json({ url: authUrl });
  });

  /**
   * GET /api/auth/google/callback
   * Handles the Google OAuth callback after user consent.
   * Exchanges code for token, gets user info, creates session.
   */
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    const code = req.query.code as string | undefined;
    const state = req.query.state as string | undefined;
    const error = req.query.error as string | undefined;

    if (error) {
      console.error("[Google Auth] OAuth error:", error);
      res.status(400).json({ error: `Google OAuth error: ${error}` });
      return;
    }

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      const config = getGoogleConfig();

      // Parse state to determine platform
      let platform = "web";
      let mobileRedirect: string | undefined;
      if (state) {
        try {
          const statePayload = JSON.parse(Buffer.from(state, "base64url").toString());
          platform = statePayload.platform || "web";
          mobileRedirect = statePayload.mobileRedirect;
        } catch {
          // Invalid state, default to web
        }
      }

      // Exchange code for tokens
      const tokenData = await exchangeGoogleCode(code, config.redirectUri);

      // Get user info from Google
      const googleUser = await getGoogleUserInfo(tokenData.access_token);

      // Use Google's user ID prefixed with "google_" as the openId
      const openId = `google_${googleUser.id}`;

      // Upsert user in our database
      await upsertUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      // Get the full user record from DB (includes id)
      const dbUser = await getUserByOpenId(openId);

      // Create our app's session token (same JWT as Manus OAuth)
      const sessionToken = await sdk.createSessionToken(openId, {
        name: googleUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      if (platform === "mobile" && mobileRedirect) {
        // For mobile: redirect to the app's deep link with the session token + user info
        const userPayload = Buffer.from(
          JSON.stringify(buildUserResponse(dbUser || {
            openId,
            name: googleUser.name,
            email: googleUser.email,
            loginMethod: "google",
            lastSignedIn: new Date(),
          }))
        ).toString("base64url");

        const separator = mobileRedirect.includes("?") ? "&" : "?";
        const redirectUrl = `${mobileRedirect}${separator}sessionToken=${encodeURIComponent(sessionToken)}&user=${encodeURIComponent(userPayload)}`;
        console.log("[Google Auth] Mobile redirect to:", redirectUrl.substring(0, 100) + "...");
        res.redirect(302, redirectUrl);
      } else {
        // For web: set cookie and redirect to frontend
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        const frontendUrl =
          process.env.EXPO_WEB_PREVIEW_URL ||
          process.env.EXPO_PACKAGER_PROXY_URL ||
          "http://localhost:8081";
        res.redirect(302, frontendUrl);
      }
    } catch (err) {
      console.error("[Google Auth] Callback error:", err);
      res.status(500).json({ error: "Google authentication failed" });
    }
  });

  /**
   * POST /api/auth/google/token
   * Alternative flow for mobile: exchange a Google auth code directly for an app session.
   * Used when the mobile app handles the Google consent screen itself.
   */
  app.post("/api/auth/google/token", async (req: Request, res: Response) => {
    const { code, redirectUri } = req.body || {};

    if (!code) {
      res.status(400).json({ error: "Authorization code is required" });
      return;
    }

    try {
      const config = getGoogleConfig();
      const effectiveRedirectUri = redirectUri || config.redirectUri;

      // Exchange code for tokens
      const tokenData = await exchangeGoogleCode(code, effectiveRedirectUri);

      // Get user info from Google
      const googleUser = await getGoogleUserInfo(tokenData.access_token);

      // Use Google's user ID prefixed with "google_" as the openId
      const openId = `google_${googleUser.id}`;

      // Upsert user in our database
      await upsertUser({
        openId,
        name: googleUser.name || null,
        email: googleUser.email || null,
        loginMethod: "google",
        lastSignedIn: new Date(),
      });

      const user = await getUserByOpenId(openId);

      // Create our app's session token
      const sessionToken = await sdk.createSessionToken(openId, {
        name: googleUser.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      // Set cookie for web
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        sessionToken,
        user: buildUserResponse(user || {
          openId,
          name: googleUser.name,
          email: googleUser.email,
          loginMethod: "google",
          lastSignedIn: new Date(),
        }),
      });
    } catch (err) {
      console.error("[Google Auth] Token exchange error:", err);
      res.status(500).json({ error: "Google authentication failed" });
    }
  });
}
