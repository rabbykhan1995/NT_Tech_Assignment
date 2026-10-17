import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import * as Sentry from "@sentry/node";
import router from "./routes/index.route"; // main router
import { ApiError } from "./utils/ApiError";

const app = express();

// ETag বন্ধ রাখা হয় যাতে GET /api রেসপন্সে 304 Not Modified না আসে।
app.set("etag", false);

// Reverse Proxy (Nginx/Cloudflare) থাকলে IP সঠিকভাবে পাওয়ার জন্য
app.set("trust proxy", 1);

// ---------------------------------------------------------
// 1. HELMET: Security Headers Setup
// ---------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false, // Dev/Local environment-এ রিকোয়েস্ট ব্লক প্রতিরোধ করতে
    crossOriginEmbedderPolicy: false,
  })
);

app.disable("x-powered-by");

// ---------------------------------------------------------
// 2. CORS CONFIGURATION (FIXED FOR PREFLIGHT & LOGIN)
// --------------------------------------------------------

const allowedOrigins = [
  "http://localhost:5173",

];


app.use(
  cors({
    origin: [
      "http://localhost:5173",
    ],

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Token",
      "X-Requested-With",
      "Accept",
    ],
  })
);


// ---------------------------------------------------------
// 3. RATE LIMITING
// ---------------------------------------------------------
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // টেস্ট করার জন্য এখন কিছুটা শিথিল রাখা হলো
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

// ---------------------------------------------------------
// 5. BODY PARSERS & PAYLOAD LIMITS
// ---------------------------------------------------------
app.use(express.json({ limit: "10mb" })); // 10kb থেকে বাড়িয়ে 10mb করা হলো
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use(hpp());

// ---------------------------------------------------------
// 6. MAIN API ROUTES
// ---------------------------------------------------------
app.use("/api", router);

// ---------------------------------------------------------
// 7. SENTRY & ERROR HANDLER
// ---------------------------------------------------------
Sentry.setupExpressErrorHandler(app);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const isOperational = err instanceof ApiError;
  const statusCode = isOperational ? err.statusCode : 500;

  if (process.env.NODE_ENV === "production" && !isOperational) {
    Sentry.captureException(err, {
      extra: { path: req.path, method: req.method, body: req.body },
    });
  } else {
    console.error("💥 Dev Error Log:", err);
  }

  return res.status(statusCode).json({
    success: false,
    message: isOperational ? err.message : "Internal Server Error",
  });
});


const PING_INTERVAL = 4 * 60 * 1000; // ৪ মিনিট পর পর
const SERVER_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';

setInterval(async () => {
  try {
    // শুধু পিং করা, কোনো সফলতার লগ প্রিন্ট হবে না যাতে কনসোল পরিষ্কার থাকে
    await fetch(`${SERVER_URL}/`);
  } catch (error) {
    // শুধুমাত্র যদি রিকোয়েস্ট ফেইল করে তবেই লগ দেখাবে
    // console.error('[Keep-Alive] Ping failed:', error);
  }
}, PING_INTERVAL);

export default app;