import { Router } from "express";
import { authMiddleware } from "../middleware/auth.js";
import Auth from "./auth.js";
import User from "./user.js";
import Product from "./product.js";
import ProductImg from "./productImage.js";
import cart from "./cart.js";
import testimonials from "./testimonials.js";
import order from "./order.js";

const router = Router();
// without middleware routes
router.use("/auth", Auth);
// with middleware routes
router.use(authMiddleware);
router.use("/user", User);
router.use("/product",Product);
router.use("/product/image",ProductImg);
router.use("/cart",cart)
router.use("/testimonials",testimonials)
router.use('/order',order)
// router.use("/user", User);

export default router;
