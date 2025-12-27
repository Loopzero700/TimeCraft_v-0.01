import User from '../../models/userSchema.js';
import Address from '../../models/addressSchema.js';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import sharp from 'sharp';
import { cloudinary } from '../../middleware/cloudinaryConfig.js';
import { NotFoundError } from '../../helpers/errorClasses.js';

// --- Helpers ---
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

// --- User Profile Services ---

export const getUserById = async (userId) => {
    return await User.findById(userId);
};

export const updateUserDetails = async (userId, formData) => {
    return await User.findByIdAndUpdate(userId, {
        username: formData.username,
        last_name: formData.lastname,
        first_name: formData.firstname,
        phone: formData.phone
    }, { new: true });
};

export const verifyPassword = async (userId, plainPassword) => {
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError("User not found");
    return await bcrypt.compare(plainPassword, user.password);
};

export const updateUserPassword = async (userId, newPassword) => {
    const hashedPass = await securePassword(newPassword);
    return await User.findByIdAndUpdate(userId, { password: hashedPass });
};

export const sendOtpService = async (email) => {
    const otp = generateOtp();
    const isSent = await sendEmail(email, otp);
    if (!isSent) throw new Error("Failed to send email");
    return otp;
};

export const updateUserEmail = async (userId, newEmail) => {
    return await User.findByIdAndUpdate(userId, { email: newEmail });
};

export const uploadProfileImage = async (userId, fileBuffer) => {
    const optimizedImage = await sharp(fileBuffer)
        .resize(300, 300)
        .jpeg({ quality: 90 })
        .toBuffer();

    const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            { folder: 'user_profiles' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(optimizedImage);
    });

    await User.findByIdAndUpdate(userId, { profile_photo: uploaded.secure_url }, { new: true });
    return uploaded.secure_url;
};

// --- Address Services ---

export const getUserAddresses = async (userId) => {
    return await Address.find({ user_id: userId });
};

export const getAddressById = async (addressId) => {
    const address = await Address.findById(addressId);
    if (!address) throw new NotFoundError("Address not found");
    return address;
};

export const addUserAddress = async (userId, data) => {
    // 1. Check if user has any address
    const isAddress = await Address.findOne({ user_id: userId });
    let isDefault = false;

    // 2. Logic to determine if this should be default
    if (!isAddress) {
        isDefault = true;
    } else if (data.isDefault === "on") {
        const oldDefault = await Address.findOne({ user_id: userId, is_default: true });
        if (oldDefault) {
            await Address.findByIdAndUpdate(oldDefault._id, { is_default: false });
        }
        isDefault = true;
    }

    const address = new Address({
        user_id: userId,
        name: data.name,
        phone_number: data.mobile,
        house_name: data.house,
        locality: data.street,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        is_default: isDefault
    });

    return await address.save();
};

export const deleteUserAddress = async (addressId) => {
    const address = await Address.findById(addressId);
    if (!address) throw new NotFoundError("Address not found");

    // If deleting the default address, make another one default automatically
    if (address.is_default) {
        const newDefault = await Address.findOne({ user_id: address.user_id, _id: { $ne: addressId } });
        if (newDefault) {
            await Address.findByIdAndUpdate(newDefault._id, { is_default: true });
        }
    }
    return await Address.findByIdAndDelete(addressId);
};

export const updateUserAddress = async (userId, addressId, data) => {
    const address = await Address.findById(addressId);
    if (!address) throw new NotFoundError("Address not found");

    let isDefault = false;

    // Logic for swapping default status
    if (!data.isDefault && address.is_default === true) {
        // Trying to uncheck default: Find another address to make default
        const anyDefault = await Address.findOne({ user_id: userId, is_default: true, _id: { $ne: addressId } });
        if (!anyDefault) {
            // Force set another one as default if user tries to have NO default
             await Address.updateOne(
                { user_id: userId, _id: { $ne: addressId } },
                { $set: { is_default: true } }
            );
        }
    } else if (data.isDefault) { // If user checked "Make Default"
        await Address.updateMany(
            { user_id: userId, _id: { $ne: addressId } },
            { $set: { is_default: false } }
        );
        isDefault = true;
    }

    return await Address.findByIdAndUpdate(addressId, {
        name: data.name,
        phone_number: data.mobile,
        house_name: data.house,
        locality: data.street,
        city: data.city,
        state: data.state,
        country: data.country,
        pincode: data.pincode,
        is_default: isDefault
    });
};