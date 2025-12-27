import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as walletService from "../../service/user/userWalletControllerService.js";

const getWallet = asynchandler(async (req, res) => {
  const userId = req.user || req.session.user;

  const walletData = await walletService.getUserWallet(userId);

  const breadcrumbs = [
    { name: "Home", link: "/" },
    { name: "Account", link: `/account` },
    { name: "Wallet", link: `/account/wallet` },
  ];

  res.render("user/wallet", {
    user: userId,
    walletData: walletData,
    breadcrumbs: breadcrumbs,
  });
});

const addWalletAmount = asynchandler(async (req, res) => {
  try {
    const order = await walletService.initiateWalletRecharge(req.body.amount);
    res.status(httpStatus.OK).json(order);
  } catch (error) {
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: error.message });
  }
});

const verifyPayment = asynchandler(async (req, res) => {
  const { response, orderData } = req.body;
  const userId = req.user || req.session.user;

  try {
    await walletService.verifyAndRecharge(userId, response, orderData);
    res.json({ success: true, message: "Payment verified and wallet updated" });
  } catch (error) {
    res
      .status(httpStatus.BAD_REQUEST)
      .json({ success: false, message: error.message });
  }
});

const getTransaction = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  res.render("user/transaction", {
    Data: [],
    pagination: {},
    user: userId,
  });
});

const getTransactionData = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;

  try {
    const { results, pagination } = await walletService.getTransactionHistory(
      userId,
      req.query
    );

    res.status(httpStatus.OK).json({
      Data: results,
      pagination: pagination,
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
    }
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Error fetching transactions" });
  }
});

export {
  getWallet,
  addWalletAmount,
  verifyPayment,
  getTransaction,
  getTransactionData,
};
