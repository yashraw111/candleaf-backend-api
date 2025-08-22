import { Router } from "express";
import Auth from "../controller/auth/authcontroller.js";
const router = Router();

router.route("/signup").post((req, res, next) => {
  const c = new Auth();
  return c.signup(req, res, next);
});
router.route("/login").post((req, res, next) => {
  const c = new Auth();
  return c.login(req, res, next);
});

router.route("/forgot_pass").post((req,res,next)=>{
  const c = new Auth()
  return c.forgotPass(req,res,next)
})

router.route("/reset_pass").put((req,res,next)=>{
  const c = new Auth()
  return c.resetPass(req,res,next)
})
export default router;
