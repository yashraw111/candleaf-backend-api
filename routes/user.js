import { Router } from "express";
import User from "../controller/user/usercontroller.js";
const router = Router();

router.route("/get-all").get((req, res, next) => {
  const c = new User();
  return c.get_all(req, res, next);
});
router.route("/get-single").get((req, res, next) => {
  const c = new User();
  return c.getSingleUser(req, res, next);
});
router.route("/").delete((req, res, next) => {
  const c = new User();
  return c.deleteUser(req, res, next);
});
router.route("/edit_profile").put((req, res, next) => {
  const c = new User();
  return c.updateUser(req, res, next);
});

router.route("/change_pass").put((req,res,next)=>{
  const c = new User()
  return c.changePass(req,res,next)
})
export default router;
