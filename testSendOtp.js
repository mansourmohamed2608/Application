const crypto = require("crypto"); // For generating OTP

var request = require("request");
const phone = "+201095013536";
const otp = crypto.randomInt(100000, 999999).toString(); // Generate OTP

const options = {
  method: "POST",
  url: "https://instawhats.com/api/create-message",
  headers: {},
  formData: {
    appkey: "3ce72a03-562b-42f2-b107-600fcc2093cd",
    authkey: "v83Rh1D4KcZyOvWsWPIR7VJWzKB12XFjZeXIwQNzY7hBbLCDZo",
    to: phone,
    message: `Your OTP code is: ${otp}`,
    file: "",
  },
};

request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
