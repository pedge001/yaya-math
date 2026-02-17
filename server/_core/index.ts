import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  // Root endpoint for Railway healthcheck
  app.get("/", (_req, res) => {
    res.json({ status: "ok", service: "YaYa Math API", timestamp: Date.now() });
  });

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Privacy policy endpoint for App Store submission
  app.get("/privacy", (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YaYa Math - Privacy Policy</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    h1 {
      color: #B6FFFB;
      background: #000;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    h2 {
      color: #000;
      margin-top: 30px;
      border-bottom: 2px solid #B6FFFB;
      padding-bottom: 10px;
    }
    ul {
      padding-left: 20px;
    }
    li {
      margin: 10px 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      text-align: center;
      color: #666;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <h1>YaYa Math Privacy Policy</h1>
  
  <h2>Data Collection</h2>
  <p>YaYa Math collects minimal data to enable competitive gameplay. When you submit scores to the leaderboard, we collect:</p>
  <ul>
    <li>Your 3-character initials (chosen by you)</li>
    <li>Your score and completion time</li>
    <li>The operation type and difficulty level</li>
  </ul>

  <h2>Data Usage</h2>
  <p>Your data is used exclusively to display global leaderboards and enable users to compete against one another. We do not:</p>
  <ul>
    <li>Sell your data to third parties</li>
    <li>Use your data for advertising</li>
    <li>Share your data with anyone outside of the app</li>
    <li>Track your personal identity or location</li>
  </ul>

  <h2>Local Data</h2>
  <p>The following data is stored locally on your device and never sent to our servers:</p>
  <ul>
    <li>Personal best scores</li>
    <li>Achievement progress</li>
    <li>Practice statistics and history</li>
    <li>Daily challenge streak counter</li>
  </ul>

  <h2>Data Security</h2>
  <p>All data transmitted to our servers is encrypted using industry-standard HTTPS protocols. Leaderboard data is stored securely and is only accessible through the app.</p>

  <h2>Children's Privacy</h2>
  <p>YaYa Math is designed for users of all ages. We do not knowingly collect personal information from children. The app only collects anonymous initials and scores for leaderboard purposes.</p>

  <h2>Contact</h2>
  <p>If you have questions about this privacy policy or your data, please contact us through the App Store.</p>

  <div class="footer">
    <p>Last updated: February 16, 2026</p>
  </div>
</body>
</html>
    `);
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
