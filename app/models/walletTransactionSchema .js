const mongoose = require("mongoose")

const walletTransactionSchema = new mongoose.Schema({
  wallet_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  type: {
    type: String,
    enum: ["refund", "debit", "referral"],
    required: true,
  },
  description: {
    type: String,
  },
  transaction_date: {
    type: Date,
    default: Date.now,
  },
  order_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
}, { timestamps: true })

module.exports = mongoose.model("WalletTransaction", walletTransactionSchema)
