import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as wishlistService from "../../service/user/userWishlistControlerService.js";

const getWishlist = asynchandler(async (req, res) => {
  try {
    const userId = req.session.user || req.user;
    const productList = await wishlistService.getUserWishlist(userId);

    res.render("user/wishlist", {
      user: userId,
      wishlist: productList,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .render("user/error", { message: "Failed to load wishlist" });
  }
});

const addWishlist = asynchandler(async (req, res) => {
  const userId = req.session.user || req.user;
  const { productId, index } = req.body;

  if (!userId) {
    return res
      .status(httpStatus.UNAUTHORIZED)
      .json({ message: "You need to login first to add items to your wishList.", Url: "/" });
  }

  try {
    const result = await wishlistService.toggleWishlistItem(
      userId,
      productId,
      index
    );

    const statusCode =
      result.status === "added" ? httpStatus.CREATED : httpStatus.OK;

    return res.status(statusCode).json({ message: result.message , action: result.status });
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: error.message });
  }
});

const removeWishlist = asynchandler(async (req, res) => {
  try {
    await wishlistService.removeWishlistItem(req.params.id);
    res.status(httpStatus.OK).json({ message: "Wishlist is removed", action:"removed"});
  } catch (error) {
    if (error instanceof NotFoundError) {
      return res.status(httpStatus.NOT_FOUND).json({ message: error.message });
    }
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Server Error" });
  }
});

export { getWishlist, addWishlist, removeWishlist };
