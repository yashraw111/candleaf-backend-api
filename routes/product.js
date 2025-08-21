import { Router } from "express";
import Product from "../controller/product/productcontroller.js";
const router = Router();

router.route("/").post((req, res, next) => {
  const c = new Product();
  return c.AddProduct(req, res, next);
});
router.route("/allProduct").get((req,res,next)=>{
  const c = new Product()
  return c.allProduct(req,res,next)
})
router.route("/:id").delete((req, res, next) => {
    const c = new Product();
    return c.deleteProduct(req, res, next);
});
router.route("/:id").put((req, res, next) => {
    const c = new Product();
    return c.updateProduct(req, res, next);
});

router.route("/:id").get((req, res, next) => {
    const c = new Product();
    return c.singleProduct(req, res, next);
});


export default router;
