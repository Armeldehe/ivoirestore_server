/**
 * Application Express - IvoireStore Backend
 * Configuration complète avec toutes les sécurités de production
 *
 * Middlewares de sécurité appliqués :
 * - helmet       : En-têtes HTTP sécurisés
 * - cors         : Contrôle des origines
 * - rate-limit   : Protection brute force
 * - xss-clean    : Protection XSS
 * - mongo-sanitize : Protection injection NoSQL
 * - express-validator : Validation des données
 */

const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const mongoSanitize = require("express-mongo-sanitize");
const morgan = require("morgan");

const errorHandler = require("./middlewares/errorHandler");
const logger = require("./utils/logger");

// Import des routes
const authRoutes = require("./routes/authRoutes");
const boutiqueRoutes = require("./routes/boutiqueRoutes");
const produitRoutes = require("./routes/produitRoutes");
const commandeRoutes = require("./routes/commandeRoutes");
const adminRoutes = require("./routes/adminRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const avisRoutes = require("./routes/avisRoutes");
const vendeurAuthRoutes = require("./routes/vendeurAuthRoutes");
const vendeurProduitRoutes = require("./routes/vendeurProduitRoutes");
const vendeurCommandeRoutes = require("./routes/vendeurCommandeRoutes");

const app = express();

// CONFIGURATION CORS — Origines autorisées
const ALLOWED_ORIGINS = [
  "https://ivoirestore.com",
  "https://www.ivoirestore.com",
  "https://ivoirestore-client.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (
    origin &&
    (ALLOWED_ORIGINS.includes(origin) || origin.startsWith("http://localhost"))
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Réponse immédiate pour le "Preflight" (OPTIONS)
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// Logger pour debug
app.use((req, res, next) => {
  logger.info(
    `[DEBUG] ${req.method} ${req.url} - Origin: ${req.headers.origin || "none"}`,
  );
  next();
});

// Helmet : en-têtes HTTP sécurisés
app.use(helmet());

// Rate Limiter global : 500 requêtes par 15 minutes par IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: {
    success: false,
    message:
      "Trop de requêtes depuis cette adresse IP. Réessayez dans 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", globalLimiter);

// Rate Limiter strict pour l'authentification : 30 tentatives par heure
// On l'applique sur /login et /register uniquement pour ne pas bloquer les checks de session /me
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 30,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Réessayez dans 1 heure.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ─── Middlewares de Parsing ───────────────────────────────────────────────────

// Parser le body JSON (limite à 10kb pour éviter les attaques)
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Middleware de Sanitisation pour Express 5 (NoSQL & XSS)
// Évite la réassignation de req.query qui est en lecture seule dans Express 5
const xss = require("xss-filters");

app.use((req, res, next) => {
  // Fonction locale pour nettoyer récursivement un objet contre XSS
  const cleanXSS = (obj) => {
    if (typeof obj !== "object" || obj === null) return;
    Object.keys(obj).forEach((key) => {
      if (typeof obj[key] === "string") {
        obj[key] = xss.inHTMLData(obj[key]).trim();
      } else if (typeof obj[key] === "object") {
        cleanXSS(obj[key]);
      }
    });
  };

  // 1. Sanitisation NoSQL (In-place mutation)
  if (req.body) mongoSanitize.sanitize(req.body);
  if (req.query) mongoSanitize.sanitize(req.query);
  if (req.params) mongoSanitize.sanitize(req.params);

  // 2. Sanitisation XSS (In-place mutation)
  if (req.body) cleanXSS(req.body);
  if (req.query) cleanXSS(req.query);
  if (req.params) cleanXSS(req.params);

  next();
});

// ─── Logger HTTP ─────────────────────────────────────────────────────────────

// Morgan pour les logs HTTP
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  // En production, utiliser un format compact
  app.use(
    morgan("combined", {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }),
  );
}

// ─── Route de Santé ──────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "🛒 Bienvenue sur l'API IvoireStore - Marketplace Multi-Boutiques",
    version: "1.0.0",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes API ──────────────────────────────────────────────────────────────

app.use("/api/auth", authRoutes);
app.use("/api/boutiques", boutiqueRoutes);
app.use("/api/products", produitRoutes);
app.use("/api/orders", commandeRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/avis", avisRoutes);
app.use("/api/vendeur", vendeurAuthRoutes);
app.use("/api/vendeur/products", vendeurProduitRoutes);
app.use("/api/vendeur/orders", vendeurCommandeRoutes);

// ─── Route 404 ───────────────────────────────────────────────────────────────

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route introuvable : ${req.method} ${req.originalUrl}`,
  });
});

// ─── Handler d'Erreurs Centralisé ────────────────────────────────────────────
// Doit être le dernier middleware
app.use(errorHandler);

module.exports = app;
