require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");
const path = require("path");
const fs = require("fs");

const https = require("https");
const { initializeSocket } = require("./socket");
//set app
const app = express();
const PORT = process.env.PORT || 443;

// ssl options
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "../certs/nginx.key")),
  cert: fs.readFileSync(path.join(__dirname, "../certs/nginx.crt")),
};
const server = https.createServer(httpsOptions, app);
const io = initializeSocket(server);

//config
require("./config/passport")(passport);

// Middleware
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(passport.initialize());
app.set("trust proxy", 1);

// Socket.io initialization
app.set("io", io);

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const topicsRoutes = require("./routes/topics");
const { isLoggedIn, isAdmin, isApproved } = require("./middleware/auth");
const postRoutes = require("./routes/posts");
const tagRoutes = require("./routes/tags");
const adminPanelRoutes = require("./routes/adminPanel");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", isLoggedIn, userRoutes);
app.use("/api/admin", isLoggedIn, isAdmin, adminRoutes);
app.use("/api/topics", isLoggedIn, isApproved, topicsRoutes);
app.use("/api/", isLoggedIn, isApproved, postRoutes);
app.use("/api/tags", isLoggedIn, isApproved, tagRoutes);
app.use("/api/admin-panel", isLoggedIn, isAdmin, adminPanelRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));
//spa fallback
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Start server
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
