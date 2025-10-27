const Wallet = require('../../app/models/walletSchema')
const WalletTransaction = require('../../app/models/walletTransactionSchema ')
const User = require('../../app/models/userSchema')
const { model } = require('mongoose')

const addToWallet = async function(userId,reason,type,amount,orderId=null){
    try {

        if(amount<=0) throw new Error('Amount should need be a more then zero')

        const user = await User.findById(userId)
        if(!user) throw new Error('there is no user founded in the DB')
        
        const wallet = await Wallet.findOne({user_id:userId})
        if(!wallet) throw new Error('Wallet not found for this user')

        await Wallet.updateOne({_id:wallet._id},{$inc:{balance:amount}})

        const transactionUpate = new WalletTransaction({
            wallet_id:wallet._id,
            amount:amount,
            type:type,
            description:reason,
            order_id:orderId
        })

        await transactionUpate.save()
        return true
    } catch (error) {
        console.error(`Error in addToWallet helper: ${error.message}`)
        throw error
    }
}

 
const debitFromWallet = async function(userId, reason, amount, orderId = null) {
    try {
        if (amount <= 0) throw new Error('Amount should need to be more then zero')

        
        const user = await User.findById(userId)
        if (!user) throw new Error('there is no user founded in the DB')

        const wallet = await Wallet.findOne({ user_id: userId })
        if (!wallet) throw new Error('There is not wallet founded for this user')

        
        if (wallet.balance < amount) throw new Error('Insufficient wallet balance.')
        
        
        await Wallet.updateOne({ _id: wallet._id }, { $inc: { balance: -amount } })

        const transactionUpdate = new WalletTransaction({ 
            wallet_id: wallet._id,
            amount: -amount,
            type: "debit",
            description: reason,
            order_id: orderId
        })

        await transactionUpdate.save()
        return true
        
    } catch (error) {
        console.error(`Error in debitFromWallet helper: ${error.message}`)
        throw error
    }
}


module.exports={
    addToWallet,
    debitFromWallet
}