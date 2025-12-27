import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import { NotFoundError } from "../../helpers/errorClasses.js";
import * as productService from "../../service/user/productControlerService.js";

const getproductPage = asynchandler(async (req, res) => {
  const productId = req.params.id;
  const userId = req.session.user || req.user;

  try {
    const userPromise = productService.getUserData(userId);
    const productPromise =
      productService.getProductDetailsWithOffers(productId);

    const WishlistPromise = productService.getWishlistData(userId);

    const [userData, product, Wishlist] = await Promise.all([
      userPromise,
      productPromise,
      WishlistPromise
    ]);

    console.log('💥',Wishlist)

    const relatedProducts = await productService.getRelatedProducts(
      product.category,
      product._id
    );

    const breadcrumbs = [
      { name: "Home", link: "/" },
      { name: "shop", link: `/shop` },
      { name: product.name, link: "#", active: true },
    ];

    res.render("user/productDetailed", {
      productData: product,
      WishlistData:Wishlist,
      cat: relatedProducts,
      breadcrumbs: breadcrumbs,
      user: userData,
    });
  } catch (error) {
    if (
      error instanceof NotFoundError ||
      error.message === "This Product is currently unavailable"
    ) {
      return res.status(httpStatus.NOT_FOUND).render("user/pageNotFound", {
        message: error.message,
      });
    }
    throw error;
  }
});

export { getproductPage };
