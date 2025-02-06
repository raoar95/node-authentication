import nodemailer from "nodemailer";

/* Constant */
import { EMAIL, PASSWORD } from "../constant/constant.js";

const sendEmail = async (emailID, subject, message) => {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL,
        pass: PASSWORD,
      },
    });

    const mailOptions = {
      from: EMAIL,
      to: emailID,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    throw new Error(error);
  }
};

const generateEmailTemplate = (text, type = "otp") => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
      <h2 style="color: #4CAF50; text-align: center;">Verification Code</h2>
      <p style="font-size: 14px; color: #333;">Dear User,</p>
      <p style="font-size: 14px; color: #333;">You are receiving this mail because you have Requested to ${
        type === "otp" || type === "Link"
          ? "Reset your TaskBuddy Account Password"
          : "Login through OTP"
      }.</p>
      <p style="font-size: 14px; color: #333;">Your Verification ${
        type === "otp" || type === "OtpLogin" ? "Code" : "Link"
      }  is:</p>
      <div style="text-align: center; margin: 20px 0;">
        <span style="display: inline-block; font-size: 22px; font-weight: bold; color: #4CAF50; padding: 10px 20px; border: 1px solid #4CAF50; border-radius: 5px; background-color: #e8f5e9;">
          ${
            type === "otp" || type === "OtpLogin"
              ? text
              : `<a href="${text}" target="_blank" style="font-size: 18px; color: #4CAF50; text-decoration: none; font-weight: bold;">Click here to Reset your Password</a>`
          }
        </span>
      </div>
      <p style="font-size: 14px; color: #333;">Please use this code to verify your email address. The code will expire in 10 minutes.</p>
      <p style="font-size: 12px; color: #333;"><strong>(IF YOU DID NOT REQUEST THIS, PLEASE IMMEDIATELY CONTACT US FOR FURTHER SUPPORT)</strong></p>
      <footer style="margin-top: 20px; text-align: center; font-size: 14px; color: #999;">
        <p>Team Your Company</p>
        <p style="font-size: 13px; color: #aaa;">This is an automated generated message. Please do not reply to this email</p>
      </footer>
    </div>
  `;
};

export { sendEmail, generateEmailTemplate };
