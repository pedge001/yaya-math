import { ThemedView } from "@/components/themed-view";
import * as Api from "@/lib/_core/api";
import * as Auth from "@/lib/_core/auth";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

/**
 * Decode a base64url-encoded string to UTF-8.
 * Works on both web and React Native.
 */
function decodeBase64Url(input: string): string {
  // Convert base64url to standard base64
  let base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if needed
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  if (typeof atob !== "undefined") {
    return atob(base64);
  }
  return Buffer.from(base64, "base64").toString("utf-8");
}

export default function OAuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    code?: string;
    state?: string;
    error?: string;
    sessionToken?: string;
    user?: string;
    name?: string;
    email?: string;
  }>();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      console.log("[OAuth] Callback handler triggered");
      console.log("[OAuth] Params received:", {
        code: params.code ? "present" : "missing",
        state: params.state ? "present" : "missing",
        error: params.error,
        sessionToken: params.sessionToken ? "present" : "missing",
        user: params.user ? "present" : "missing",
        name: params.name ? "present" : "missing",
        email: params.email ? "present" : "missing",
      });

      try {
        // === GOOGLE AUTH FLOW ===
        // The Google OAuth callback redirects here with sessionToken (and optionally user as base64url JSON)
        if (params.sessionToken) {
          console.log("[OAuth] Session token found in params (Google/OAuth callback)");
          await Auth.setSessionToken(params.sessionToken);

          // Try to decode user info from base64url-encoded 'user' param
          if (params.user) {
            try {
              const userJson = decodeBase64Url(params.user);
              const userData = JSON.parse(userJson);
              const userInfo: Auth.User = {
                id: userData.id ?? 0,
                openId: userData.openId ?? "",
                name: userData.name ?? null,
                email: userData.email ?? null,
                loginMethod: userData.loginMethod ?? "google",
                lastSignedIn: new Date(userData.lastSignedIn || Date.now()),
              };
              await Auth.setUserInfo(userInfo);
              console.log("[OAuth] User info stored from base64url param:", userInfo.name);
            } catch (err) {
              console.error("[OAuth] Failed to parse user data from base64url:", err);
              // Fallback: try to fetch user from server using the session token
              await fetchAndStoreUser();
            }
          } else {
            // No user param — fetch from server
            await fetchAndStoreUser();
          }

          setStatus("success");
          console.log("[OAuth] Authentication successful, redirecting to profile...");
          setTimeout(() => {
            router.replace("/(tabs)/profile");
          }, 1000);
          return;
        }

        // === MANUS OAUTH FLOW (legacy) ===
        // Get URL from params or Linking
        let url: string | null = null;

        if (params.code || params.state || params.error) {
          console.log("[OAuth] Found params in route params (Manus OAuth)");
          const urlParams = new URLSearchParams();
          if (params.code) urlParams.set("code", params.code);
          if (params.state) urlParams.set("state", params.state);
          if (params.error) urlParams.set("error", params.error);
          url = `?${urlParams.toString()}`;
        } else {
          const initialUrl = await Linking.getInitialURL();
          if (initialUrl) {
            url = initialUrl;
          }
        }

        // Check for error
        const error =
          params.error || (url ? new URL(url, "http://dummy").searchParams.get("error") : null);
        if (error) {
          console.error("[OAuth] Error parameter found:", error);
          setStatus("error");
          setErrorMessage(error || "OAuth error occurred");
          return;
        }

        // Check for code and state
        let code: string | null = null;
        let state: string | null = null;
        let sessionToken: string | null = null;

        if (params.code && params.state) {
          code = params.code;
          state = params.state;
        } else if (url) {
          try {
            const urlObj = new URL(url);
            code = urlObj.searchParams.get("code");
            state = urlObj.searchParams.get("state");
            sessionToken = urlObj.searchParams.get("sessionToken");
          } catch {
            const match = url.match(/[?&](code|state|sessionToken)=([^&]+)/g);
            if (match) {
              match.forEach((param) => {
                const [key, value] = param.substring(1).split("=");
                if (key === "code") code = decodeURIComponent(value);
                if (key === "state") state = decodeURIComponent(value);
                if (key === "sessionToken") sessionToken = decodeURIComponent(value);
              });
            }
          }
        }

        // If we have sessionToken directly from URL, use it
        if (sessionToken) {
          await Auth.setSessionToken(sessionToken);
          await fetchAndStoreUser();
          setStatus("success");
          setTimeout(() => {
            router.replace("/(tabs)/profile");
          }, 1000);
          return;
        }

        // Otherwise, exchange code for session token (Manus OAuth)
        if (!code || !state) {
          setStatus("error");
          setErrorMessage("Missing code or state parameter");
          return;
        }

        const result = await Api.exchangeOAuthCode(code, state);

        if (result.sessionToken) {
          await Auth.setSessionToken(result.sessionToken);

          if (result.user) {
            const userInfo: Auth.User = {
              id: result.user.id,
              openId: result.user.openId,
              name: result.user.name,
              email: result.user.email,
              loginMethod: result.user.loginMethod,
              lastSignedIn: new Date(result.user.lastSignedIn || Date.now()),
            };
            await Auth.setUserInfo(userInfo);
          }

          setStatus("success");
          setTimeout(() => {
            router.replace("/(tabs)/profile");
          }, 1000);
        } else {
          setStatus("error");
          setErrorMessage("No session token received");
        }
      } catch (error) {
        console.error("[OAuth] Callback error:", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error ? error.message : "Failed to complete authentication",
        );
      }
    };

    handleCallback();
  }, [params.code, params.state, params.error, params.sessionToken, params.user, router]);

  /**
   * Fetch user info from the server using the stored session token
   * and cache it locally for the useAuth hook.
   */
  async function fetchAndStoreUser() {
    try {
      const apiUser = await Api.getMe();
      if (apiUser) {
        const userInfo: Auth.User = {
          id: apiUser.id,
          openId: apiUser.openId,
          name: apiUser.name,
          email: apiUser.email,
          loginMethod: apiUser.loginMethod,
          lastSignedIn: new Date(apiUser.lastSignedIn),
        };
        await Auth.setUserInfo(userInfo);
        console.log("[OAuth] User info fetched and stored from /api/auth/me");
      }
    } catch (err) {
      console.warn("[OAuth] Could not fetch user from server:", err);
    }
  }

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom", "left", "right"]}>
      <ThemedView className="flex-1 items-center justify-center gap-4 p-5">
        {status === "processing" && (
          <>
            <ActivityIndicator size="large" />
            <Text className="mt-4 text-base leading-6 text-center text-foreground">
              Completing authentication...
            </Text>
          </>
        )}
        {status === "success" && (
          <>
            <Text className="text-base leading-6 text-center text-foreground">
              Authentication successful!
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              Redirecting...
            </Text>
          </>
        )}
        {status === "error" && (
          <>
            <Text className="mb-2 text-xl font-bold leading-7 text-error">
              Authentication failed
            </Text>
            <Text className="text-base leading-6 text-center text-foreground">
              {errorMessage}
            </Text>
          </>
        )}
      </ThemedView>
    </SafeAreaView>
  );
}
