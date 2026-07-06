import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { getApiBaseUrl } from "@/constants/oauth";

/**
 * Get the deep link URI for the OAuth callback on native.
 * This matches the scheme defined in app.config.ts.
 */
function getGoogleCallbackDeepLink(): string {
  return Linking.createURL("/oauth/callback");
}

/**
 * Initiate Google OAuth login flow.
 * 
 * 1. Calls the server to get the Google consent URL
 * 2. Opens the URL in the system browser (native) or redirects (web)
 * 3. After consent, Google redirects to our server callback
 * 4. Server exchanges code, creates session, and redirects back to the app
 *    with a sessionToken param (handled by app/oauth/callback.tsx)
 */
export async function startGoogleLogin(): Promise<void> {
  const apiBase = getApiBaseUrl();
  const platform = Platform.OS === "web" ? "web" : "mobile";
  
  // For mobile, tell the server where to redirect after auth
  const mobileRedirect = platform === "mobile" ? getGoogleCallbackDeepLink() : undefined;

  // Build the URL to get the Google auth URL from our server
  const params = new URLSearchParams({ platform });
  if (mobileRedirect) {
    params.set("redirect_uri", mobileRedirect);
  }

  const response = await fetch(`${apiBase}/api/auth/google?${params.toString()}`);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to get Google login URL");
  }

  const { url } = await response.json();

  if (!url) {
    throw new Error("No Google auth URL received from server");
  }

  if (Platform.OS === "web") {
    // On web, redirect the browser
    window.location.href = url;
  } else {
    // On native, open in system browser so the deep link callback works
    // Using openBrowserAsync provides a better UX than Linking.openURL
    // but we need to use openURL for the deep link redirect to work
    await Linking.openURL(url);
  }
}
