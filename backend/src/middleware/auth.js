const passport = require("passport");

function isLoggedIn(req, res, next) {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (user.Banned) {
      return res.status(403).json({ message: "Forbidden: User is banned" });
    }
    req.user = user;
    next();
  })(req, res, next);
}

function isAdmin(req, res, next) {
  isLoggedIn(req, res, () => {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Forbidden: Admins only" });
    }
    next();
  });
}

module.exports = {
  isLoggedIn,
  isAdmin,
};
