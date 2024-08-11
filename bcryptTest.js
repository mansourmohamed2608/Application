const bcrypt = require("bcrypt");

async function testCompare() {
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  console.log(`Original Password: ${password}`);
  console.log(`Hashed Password: ${hashedPassword}`);

  // Now compare the plain password with the hashed password
  const isMatch = await bcrypt.compare(password, hashedPassword);

  if (isMatch) {
    console.log("Password match: Success");
  } else {
    console.log("Password match: Failed");
  }
}

testCompare();
