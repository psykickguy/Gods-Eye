const { setGlobalOptions } = require("firebase-functions");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

setGlobalOptions({ maxInstances: 10 });

admin.initializeApp();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "patrickbatemanyash@gmail.com",
    pass: "aynw cqko lvip qsjd", // Use an App Password, not your Gmail password!
  },
});

exports.sendOtpEmail = functions.https.onCall(async (data, context) => {
  const { email, otp } = data;

  const mailOptions = {
    from: "YOUR_GMAIL@gmail.com",
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}); 