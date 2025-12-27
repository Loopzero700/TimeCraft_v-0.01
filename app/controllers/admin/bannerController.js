import asynchandler from "express-async-handler";
import httpStatus from "../../constants/httpStatus.js";
import ErrorMessage from "../../constants/errorMessages.js";
import * as bannerService from "../../service/admin/bannerControllerService.js";

const getBannerPage = asynchandler(async (req, res) => {
  const { handPicked1, handPicked2, handPicked3, mainBanner } =
    await bannerService.getAllBanners();

  res.render("admin/banner", {
    layout: "layouts/admin",
    main: mainBanner,
    slot1: handPicked1,
    slot2: handPicked2,
    slot3: handPicked3,
  });
});

const uploadBanner = async (req, res) => {
  try {
    const { slotId, description } = req.body;

    if (!req.file) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, message: ErrorMessage.BAD_REQUEST });
    }

    if (!slotId) {
      return res
        .status(httpStatus.BAD_REQUEST)
        .json({ success: false, message: ErrorMessage.BAD_REQUEST });
    }

    const updatedBanner = await bannerService.updateBannerImage(
      req.file.buffer,
      slotId,
      description
    );

    res.status(httpStatus.OK).json({
      success: true,
      message: "Banner updated successfully!",
      banner: updatedBanner,
    });
  } catch (error) {
    console.error("Error uploading banner:", error);
    res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: ErrorMessage.SERVER_ERROR });
  }
};

export { getBannerPage, uploadBanner };
