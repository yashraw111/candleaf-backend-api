import { Router } from "express";
import Order from "../controller/order/orderController.js";
const router = Router();

router.route("/checkout").post((req, res, next) => {
  const c = new Order();
  return c.checkout(req, res, next);
});

router.route("/status/:id").put((req,res,next)=>{
    const c= new Order()
    return c.updateOrderStatus(req,res,next)
})
router.route("/").get((req,res,next)=>{
    const c = new Order()
    return c.myAllOrders(req,res,next)
})
router.route("/verify-payment").post((req,res,next)=>{
    const c = new Order()
    return c.verifyPayment(req,res,next)
})



export default router;
