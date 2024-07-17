const crypto = require("crypto");
const fs = require("fs");

// Generate a random JWT secret
const secret = crypto.randomBytes(64).toString("hex");

// Output the secret to console
console.log(`Generated JWT Secret: ${secret}`);

// Optionally, write the secret to the .env file (this is not recommended for production security best practices)
fs.appendFileSync(".env", `\nJWT_SECRET=${secret}\n`, { encoding: "utf8" });

console.log("JWT secret has been added to .env file.");
