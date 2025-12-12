require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const passport = require("passport");

const http = require("http");
const { initializeSocket } = require("./socket");
//set app
const app = express();
const PORT = process.env.PORT || 5000;
// http server
const server = http.createServer(app);
const io = initializeSocket(server);

//config
require("./config/passport")(passport);

// Middleware
app.use(cors());
app.use(express.json());
app.use(passport.initialize());

// Socket.io initialization
app.set("io", io);

// Routes
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const adminRoutes = require("./routes/admin");
const topicsRoutes = require("./routes/topics");
const { isLoggedIn } = require("./middleware/auth");
const postRoutes = require("./routes/posts");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/users", isLoggedIn, userRoutes);
app.use("/api/admin", isLoggedIn, adminRoutes);
app.use("/api/topics", isLoggedIn, topicsRoutes);
app.use("/api/", isLoggedIn, postRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

// Basic route
app.get("/", (req, res) => {
  res.send("Welcome to ProgTalk Backend!");
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
