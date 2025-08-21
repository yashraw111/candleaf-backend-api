import { Base } from "../../service/base.js";

export default class ProductImageController extends Base {
  constructor() {
    super();
  }

  async uploadImages(req, res, next) {
    try {
      const { product_id } = req.body;

      if (
        !product_id ||
        !req.files ||
        !req.files.thumb ||
        !req.files.pr_image
      ) {
        this.m =
          "product_id, a thumb file, and at least one image file are required.";
        return this.send_res(res);
      }

      const thumbUpload = await this.uploadMultipleToCloudinary(
        req.files.thumb,
        "products"
      );
      const thumbUrl = Array.isArray(thumbUpload)
        ? thumbUpload[0]
        : thumbUpload;

      const imageUrls = await this.uploadMultipleToCloudinary(
        req.files.pr_image,
        "products"
      );

      if (!thumbUrl || !imageUrls || imageUrls.length === 0) {
        this.m = "Image upload failed.";
        return this.send_res(res);
      }

      const values = imageUrls.map((url) => [product_id, url, thumbUrl]);

      const query =
        "INSERT INTO product_img (product_id, image_url, thumb) VALUES ?";
      await this.insert(query, [values]);

      const updateQuery =
        "UPDATE products SET status = 1, updated_at = NOW() WHERE id = ?";
      await this.update(updateQuery, [product_id]);

      this.s = 1;
      this.m = "Images uploaded & product published successfully.";
      this.r = { product_id, thumb: thumbUrl, images: imageUrls };
      return this.send_res(res);
    } catch (error) {
      console.error("Upload error:", error);
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async deleteImage(req, res, next) {
    try {
      const { image_id } = req.params;

      const checkImg = await this.selectOne(
        "SELECT * from product_img where id = ? ",
        [image_id]
      );
      if (!checkImg) {
        this.s = 0;
        this.m = "Image not found or already deleted.";
        return this.send_res(res);
      }
      const query = "DELETE FROM product_img WHERE id = ?";
      const deleted = await this.delete(query, [image_id]);
      this.s = 1;
      this.m = "Image deleted successfully.";

      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async updateImage(req, res, next) {
  try {
    const { image_id } = req.params;
    const checkImg = await this.selectOne(
      "SELECT * FROM product_img WHERE id = ?",
      [image_id]
    );
    if (!checkImg) {
      this.s = 0;
      this.m = "Image not found.";
      return this.send_res(res);
    }
    let newImageUrl = checkImg.image_url;
    let newThumbUrl = checkImg.thumb;
    if (req.files && req.files.pr_image) {
      const uploaded = await this.uploadMultipleToCloudinary(
        req.files.pr_image,
        "products"
      );
      newImageUrl = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    }
    if (req.files && req.files.thumb) {
      const uploadedThumb = await this.uploadMultipleToCloudinary(
        req.files.thumb,
        "products"
      );
      newThumbUrl = Array.isArray(uploadedThumb)
        ? uploadedThumb[0]
        : uploadedThumb;
    }
    if (newImageUrl === checkImg.image_url && newThumbUrl === checkImg.thumb) {
      this.s = 0;
      this.m = "No new file provided to update.";
      return this.send_res(res);
    }
    await this.update(
      "UPDATE product_img SET image_url = ?, thumb = ?, updated_at = NOW() WHERE id = ?",
      [newImageUrl, newThumbUrl, image_id]
    );

    this.s = 1;
    this.m = "Image/Thumb updated successfully.";
    this.r = {
      id: image_id,
      old: { image: checkImg.image_url, thumb: checkImg.thumb },
      new: { image: newImageUrl, thumb: newThumbUrl },
    };
    return this.send_res(res);
  } catch (error) {
    this.err = error.message;
    return this.send_res(res);
  }
}
}
