import Wallet from '../../models/walletSchema.js';
import WalletTransaction from '../../models/walletTransactionSchema.js';
import { verifyRazorpaySignature, createRazorpayOrder } from '../../helpers/Razorpay.js';
import { addToWallet } from '../../helpers/walletHelpers.js';
import paginationHelper from '../../helpers/paginate.js';
import { NotFoundError } from '../../helpers/errorClasses.js';

export const getUserWallet = async (userId) => {
    return await Wallet.findOne({ user_id: userId });
};

export const initiateWalletRecharge = async (amount) => {
    if (!amount || amount <= 0) {
        throw new Error("Invalid amount");
    }
    return await createRazorpayOrder(amount);
};

export const verifyAndRecharge = async (userId, paymentResponse, orderData) => {
    const isValid = verifyRazorpaySignature(paymentResponse, orderData);
    
    if (!isValid) {
        throw new Error("Invalid payment signature");
    }

    const amount = orderData.amount / 100;
    const reason = 'add money to wallet';
    const type = 'credit';

    await addToWallet(userId, reason, type, amount);

    return true;
};

export const getTransactionHistory = async (userId, query) => {
    const wallet = await Wallet.findOne({ user_id: userId });
    
    if (!wallet) {
        throw new NotFoundError("Wallet not found");
    }

    const options = {
        page: parseInt(query.page) || 1,
        limit: parseInt(query.limit) || 6,
        sort: "-createdAt",
        filters: { wallet_id: wallet._id },
    };

    const data = await paginationHelper(WalletTransaction, options);
    
    return {
        results: data.results,
        pagination: data.pagination
    };
};