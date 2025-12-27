import Banner from "../../models/bannerSchema.js";
import cloudinary from "../../config/cloudinaryConfig.js";

const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "banners" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
};

export const getAllBanners = async () => {
  const [handPicked1, handPicked2, handPicked3, mainBanner] = await Promise.all(
    [
      Banner.find({ type: "handpicked-1" }),
      Banner.find({ type: "handpicked-2" }),
      Banner.find({ type: "handpicked-3" }),
      Banner.find({ type: "main-banner" }),
    ]
  );

  return { handPicked1, handPicked2, handPicked3, mainBanner };
};

export const updateBannerImage = async (fileBuffer, slotId, description) => {
  const result = await uploadToCloudinary(fileBuffer);

  const updatedBanner = await Banner.findOneAndUpdate(
    { type: slotId },
    {
      type: slotId,
      image_url: result.secure_url,
      description: description || "",
    },
    { new: true, upsert: true }
  );

  return updatedBanner;
};
