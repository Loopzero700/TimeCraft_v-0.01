import User from '../../models/userSchema.js';
import Wallet from '../../models/walletSchema.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { addToWallet } from '../../helpers/walletHelpers.js';

const securePassword = async (password) => {
    return await bcrypt.hash(password, 10);
};

const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

const sendEmail = async (email, otp) => {
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            port: 587,
            secure: false,
            requireTLS: true,
            auth: {
                user: process.env.NODEMAILER_EMAIL,
                pass: process.env.NODEMAILER_PASS,
            },
        });

        const info = await transporter.sendMail({
            from: `"TimeCraft" <${process.env.NODEMAILER_EMAIL}>`,
            to: email,
            subject: "🔐 Your OTP Code - Account Verification",
            text: `Your OTP is ${otp}. It will expire in 10 minutes.`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                  <h2 style="color: #4CAF50; text-align: center;">Verify Your Account</h2>
                  <p>Please use the OTP below to complete your request:</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <span style="padding: 15px 25px; font-size: 24px; font-weight: bold; letter-spacing: 3px; background: #4CAF50; color: #fff; border-radius: 8px;">
                      ${otp}
                    </span>
                  </div>
                  <p>This code will expire in <b>10 minutes</b>.</p>
                </div>
            `,
        });
        return info.accepted.length > 0;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
};


export const initiateSignup = async (email) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error("User with this email already exists");
    }
    const otp = generateOtp();
    const sent = await sendEmail(email, otp);
    console.log("⭕",otp)
    if (!sent) throw new Error("Failed to send OTP email");
    return otp;
};

export const completeUserRegistration = async (username, email, password) => {
    const passwordHash = await securePassword(password);
    
    const newUser = new User({
        username,
        email,
        password: passwordHash,
        profile_photo: 'https://placehold.co/100x100/dfdcd9/31343C?text=' + username.charAt(0).toUpperCase()
    });
    await newUser.save();

    const userWallet = new Wallet({ user_id: newUser._id });
    await userWallet.save();

    return newUser;
};

export const authenticateUser = async (email, password) => {
    const user = await User.findOne({ isAdmin: 0, email: email });

    if (!user) throw new Error("User not found");
    if (user.isBlocked) throw new Error("User is blocked by admin");
    if (!user.password) throw new Error("This account uses Google Login. Please login with Google.");

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) throw new Error("Incorrect password");

    return user;
};

export const processReferralBonus = async (referrerId, newUserId) => {
    if (referrerId === newUserId.toString()) return;
    
    const referrer = await User.findById(referrerId);
    if (!referrer) return;

    const reason = "Referral Offer";
    const type = "credit";
    const amount = 500;

    await Promise.all([
        addToWallet(referrerId, reason, type, amount),
        addToWallet(newUserId, reason, type, amount)
    ]);
};

export const initiateForgotPassword = async (email) => {
    const user = await User.findOne({ email });
    if (!user) throw new Error("No account with that email address exists.");

    const otp = generateOtp();
    const sent = await sendEmail(email, otp);
    if (!sent) throw new Error("Failed to send OTP email");

    return { otp, user };
};

export const resetUserPassword = async (userId, newPassword) => {
    const hashedPass = await securePassword(newPassword);
    await User.findByIdAndUpdate(userId, { password: hashedPass });
};

export const validateReferralCode = async (code) => {
    const user = await User.findOne({ referralCode: code });
    if (!user) throw new Error("Invalid referral code.");
    return user;
};

export const resendOtpService = async (email) => {
    const otp = generateOtp();
    const sent = await sendEmail(email, otp);
    if (!sent) throw new Error("Failed to resend OTP");
    return otp;
};