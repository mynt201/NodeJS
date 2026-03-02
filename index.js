const express = require("express");
const cors = require("cors");
const connectDB = require("./config/database");
const { seedDatabase } = require("./utils/seed");
const FloodIndicator = require("./models/FloodIndicator");
const userRoutes = require("./routes/userRoutes");
const administrativeUnitRoutes = require("./routes/administrativeUnitRoutes");
const floodIndicatorRoutes = require("./routes/floodIndicatorRoutes");
const { protect, authorize } = require("./middleware/auth");
const { updateWeights } = require("./controllers/floodIndicatorController");
const indicatorValueRoutes = require("./routes/indicatorValueRoutes");
const riskAssessmentRoutes = require("./routes/riskAssessmentRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const mapRoutes = require("./routes/mapRoutes");
const wardRoutes = require("./routes/wardRoutes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});
app.use(
  express.urlencoded({
    extended: true,
  }),
);

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/administrative-units", administrativeUnitRoutes);
app.patch(
  "/api/flood-indicators/weights",
  protect,
  authorize("SUPER_ADMIN"),
  updateWeights,
);
app.use("/api/flood-indicators", floodIndicatorRoutes);
app.use("/api/indicator-values", indicatorValueRoutes);
app.use("/api/risk-assessments", riskAssessmentRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/map", mapRoutes);
app.use("/api/wards", wardRoutes);

// Migration: thêm direction cho chỉ số cũ (1 = thuận, 0 = nghịch)
const migrateDirection = async () => {
  try {
    const updated = await FloodIndicator.updateMany(
      { $or: [{ direction: { $exists: false } }, { direction: null }] },
      { $set: { direction: 1 } }
    );
    if (updated.modifiedCount > 0) {
      console.log(`🔄 Migration: đã thêm direction cho ${updated.modifiedCount} chỉ số`);
    }
  } catch (err) {
    console.error("Migration direction error:", err.message);
  }
};

// Connect to database and seed if needed
const initializeApp = async () => {
  try {
    await connectDB();

    // Migration: thêm direction cho bản ghi cũ
    await migrateDirection();

    // Seed database with default data
    await seedDatabase();
  } catch (error) {
    console.error("❌ Failed to initialize application:", error);
    process.exit(1);
  }
};

// Basic routes
app.get("/", (req, res) => {
  res.json({
    message: "Flood Risk Backend API",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "API routes are working!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (req, res) => {
  const mongoose = require("mongoose");
  res.json({
    status: "OK",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: {
      status:
        mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
      name: mongoose.connection.name || "Not connected",
      host: mongoose.connection.host || "Not connected",
    },
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong!",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Initialize app first, then start server
const startServer = async () => {
  try {
    // Initialize database first
    await initializeApp();

    // Start server after initialization
    const server = app.listen(PORT, () => {
      console.log(`🚀 Flood Risk Backend server is running on port ${PORT}`);
      console.log(
        `📍 Health check available at: http://localhost:${PORT}/api/health`,
      );
      console.log(`🔗 API available at: http://localhost:${PORT}/api`);
    });

    module.exports = app;
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
