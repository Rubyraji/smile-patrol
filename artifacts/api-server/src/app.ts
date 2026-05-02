import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    // API serves no HTML — disable CSP frame/script guards that block nothing here
    // but keep everything else (HSTS, noSniff, xssFilter, etc.)
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// ── CORS — restrict to the app's own origins ──────────────────────────────────
const allowedOrigins: string[] = [
  "http://localhost",
  "http://localhost:80",
  "http://127.0.0.1",
];

const replitDomains = process.env["REPLIT_DOMAINS"];
if (replitDomains) {
  for (const d of replitDomains.split(",")) {
    allowedOrigins.push(`https://${d.trim()}`);
  }
}

const devDomain = process.env["REPLIT_DEV_DOMAIN"];
if (devDomain) {
  allowedOrigins.push(`https://${devDomain}`);
}

app.use(
  cors({
    origin(origin, callback) {
      // Same-origin requests (no Origin header) and allowed origins pass through.
      if (
        !origin ||
        allowedOrigins.some((o) => origin === o || origin.startsWith(o + "/"))
      ) {
        callback(null, true);
      } else {
        logger.warn({ origin }, "CORS blocked");
        callback(new Error("Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type"],
    credentials: false,
  }),
);

// ── Request logging ───────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ── Body parsing — explicit 64 KB cap ────────────────────────────────────────
app.use(express.json({ limit: "64kb" }));

// ── Global rate limit: 300 req / 5 min per IP ────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please slow down." },
});
app.use("/api", globalLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api", router);

// ── 404 fallthrough ───────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: "Not found" });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
