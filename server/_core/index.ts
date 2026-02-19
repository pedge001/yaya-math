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

  // Admin password (set via environment variable or use default)
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "yaya2026";

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
      color: #3dcfc2;
      background: #000;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
    }
    h2 {
      color: #000;
      margin-top: 30px;
      border-bottom: 2px solid #3dcfc2;
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

  // Leaderboard admin page
  app.get("/leaderboardadmin", (_req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>YaYa Math - Leaderboard Admin</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background: #000;
      color: #fff;
    }
    h1 {
      color: #3dcfc2;
      text-align: center;
      margin-bottom: 30px;
    }
    .admin-section {
      background: #1a1a1a;
      border: 2px solid #3dcfc2;
      border-radius: 12px;
      padding: 30px;
      margin-bottom: 20px;
    }
    .password-section {
      margin-bottom: 30px;
    }
    .password-section input {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      border: 2px solid #3dcfc2;
      border-radius: 8px;
      background: #000;
      color: #fff;
      margin-top: 10px;
    }
    .reset-section {
      display: none;
    }
    .reset-section.unlocked {
      display: block;
    }
    button {
      width: 100%;
      padding: 15px;
      font-size: 18px;
      font-weight: bold;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      margin-top: 10px;
    }
    .btn-unlock {
      background: #3dcfc2;
      color: #000;
    }
    .btn-unlock:hover {
      opacity: 0.9;
    }
    .btn-reset {
      background: #ef4444;
      color: #fff;
    }
    .btn-reset:hover {
      background: #dc2626;
    }
    .warning {
      background: #fef3c7;
      color: #92400e;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #f59e0b;
    }
    .success {
      background: #d1fae5;
      color: #065f46;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #10b981;
    }
    .error {
      background: #fee2e2;
      color: #991b1b;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #ef4444;
    }
    .info {
      color: #9CA3AF;
      font-size: 14px;
      margin-top: 20px;
    }
    .hidden {
      display: none;
    }
  </style>
</head>
<body>
  <h1>🔧 Leaderboard Admin</h1>
  
  <div class="admin-section">
    <div class="password-section" id="passwordSection">
      <h2>Authentication Required</h2>
      <p>Enter admin password to access leaderboard management:</p>
      <input type="password" id="passwordInput" placeholder="Enter password">
      <button class="btn-unlock" onclick="checkPassword()">Unlock Admin Panel</button>
      <div id="authError" class="error hidden"></div>
    </div>

    <div class="reset-section" id="resetSection">
      <h2>Reset Leaderboards</h2>
      <div class="warning">
        <strong>⚠️ Warning:</strong> This action will permanently delete ALL entries from:
        <ul>
          <li>Practice Mode Leaderboard (all operations & difficulties)</li>
          <li>Speed Mode Leaderboard (all operations & difficulties)</li>
          <li>Daily Challenge Leaderboard (all dates)</li>
        </ul>
        This action cannot be undone!
      </div>
      
      <button class="btn-reset" onclick="resetLeaderboards()">Reset All Leaderboards</button>
      
      <div id="result" class="hidden"></div>
      
      <div class="info">
        <p><strong>Future Enhancement:</strong> Weekly automated reset can be configured as a scheduled job.</p>
        <p>Last manual reset: <span id="lastReset">Never</span></p>
      </div>
    </div>
  </div>

  <script>
    const ADMIN_PASSWORD = '${ADMIN_PASSWORD}';
    
    function checkPassword() {
      const input = document.getElementById('passwordInput');
      const error = document.getElementById('authError');
      
      if (input.value === ADMIN_PASSWORD) {
        document.getElementById('passwordSection').style.display = 'none';
        document.getElementById('resetSection').classList.add('unlocked');
        error.classList.add('hidden');
      } else {
        error.textContent = '❌ Incorrect password. Please try again.';
        error.classList.remove('hidden');
        input.value = '';
      }
    }
    
    // Allow Enter key to submit password
    document.getElementById('passwordInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        checkPassword();
      }
    });
    
    async function resetLeaderboards() {
      if (!confirm('Are you ABSOLUTELY SURE you want to reset all leaderboards? This will delete ALL entries permanently!')) {
        return;
      }
      
      const resultDiv = document.getElementById('result');
      resultDiv.textContent = 'Resetting leaderboards...';
      resultDiv.className = 'info';
      resultDiv.classList.remove('hidden');
      
      try {
        const response = await fetch('/api/admin/reset-leaderboards', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Admin-Password': ADMIN_PASSWORD
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          resultDiv.textContent = '✅ ' + data.message;
          resultDiv.className = 'success';
          document.getElementById('lastReset').textContent = new Date().toLocaleString();
        } else {
          resultDiv.textContent = '❌ Error: ' + data.error;
          resultDiv.className = 'error';
        }
      } catch (error) {
        resultDiv.textContent = '❌ Network error: ' + error.message;
        resultDiv.className = 'error';
      }
    }
  </script>
</body>
</html>
    `);
  });

  // API endpoint to reset leaderboards
  app.post("/api/admin/reset-leaderboards", async (req, res) => {
    const password = req.headers['x-admin-password'];
    
    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, error: "Unauthorized" });
    }
    
    const { resetAllLeaderboards } = await import("../db.js");
    const result = await resetAllLeaderboards();
    res.json(result);
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
