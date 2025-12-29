class AuthApi {
  static routeAuth = "/api/auth";

  constructor(app, express, users = []) {
    console.log("AuthApi Needs to load users from .env");
    this.app = app;
    this.express = express;
    this.users = users; // Array of user objects with username and password properties
    this.app.post(AuthApi.routeAuth, this.handleAuthAttempt.bind(this));
  }

  handleAuthAttempt(req, res) {
    // Check if the request body contains the expected properties
    if (!req.body) {
      res.status(400).json({ message: "Bad request" });
      return;
    }
    if (!req.body.username || !req.body.password) {
      res.status(400).json({ message: "Missing username or password" });
      return;
    }

    // Validate the credentials
    const { username, password } = req.body;
    const isValid = this.checkUserAuth(username, password);
    if (isValid) {
      res.status(200).json({ message: "Authentication successful" });
    } else {
      res.status(401).json({ message: "Invalid credentials" });
    }
  }

  checkUserAuth(user, pass) {
    for (let i = 0; i < this.users.length; i++) {
      if (this.users[i].username === user) {
        if (this.users[i].password === pass) {
          return true;
        }
      }
    }
    return false;
  }
}

export default AuthApi;
