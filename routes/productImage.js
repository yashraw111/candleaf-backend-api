import { Router } from "express";
import ProductImageController from "../controller/product/productImageController.js";

const router = Router();

// Route to upload one or more images for a product
router.route("/upload").post(
  (req, res, next) => {
    const c = new ProductImageController();
    return c.uploadImages(req, res, next);
  }
);

router.route("/delete/:image_id").delete((req, res, next) => {
    const c = new ProductImageController();
    return c.deleteImage(req, res, next);
});
router.route("/update/:image_id").put((req, res, next) => {
  const c = new ProductImageController();
  return c.updateImage(req, res, next);
});

export default router;