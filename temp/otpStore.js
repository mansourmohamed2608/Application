// otpStore.js
const otpStore = {};

// Store OTP and verification status
exports.storeOTP = (phone, otp) => {
  otpStore[phone] = { otp, verified: false };
};

// Verify OTP
exports.verifyOTP = (phone, enteredOtp) => {
  if (otpStore[phone] && otpStore[phone].otp === enteredOtp) {
    otpStore[phone].verified = true;
    return true;
  }
  return false;
};

// Check if OTP is verified
exports.isOtpVerified = (phone) => {
  return otpStore[phone]?.verified || false;
};
