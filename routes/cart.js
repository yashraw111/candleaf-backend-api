import {Router} from "express"

import Cart from "../controller/cart/cartController.js"
const router = Router()

router.route("/addtocart").post((req,res,next)=>{
    const c = new Cart()
    return c.addToCart(req,res,next)
})

router.get("/", (req, res, next) => {
  const c = new Cart();
  return c.getCart(req, res, next);
});


router.put("/update/:id", (req, res, next) => {
  const c = new Cart();
  return c.updateCart(req, res, next);
});

router.delete("/remove/:id", (req, res, next) => {
  const c = new Cart();
  return c.removeFromCart(req, res, next);
});

router.put("/increment/:id", (req, res, next) => {
  const c = new Cart();
  return c.incrementCart(req, res, next);
});

router.put("/decrement/:id", (req, res, next) => {
  const c = new Cart();
  return c.decrementCart(req, res, next);
});

export default router;