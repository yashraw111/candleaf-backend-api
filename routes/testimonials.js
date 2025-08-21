import { Router } from "express";
const router = Router();
import testimonials from "../controller/Testimonials/testimonialsController.js"
router.route("/").post((req, res, next) => {
  const c = new testimonials();
  return c.CreateTestimonials(req,res,next)
});

router.route("/").get((req, res, next) => {
  const c = new testimonials();
  return c.GetTestimonials(req, res, next);
});
router.route("/:id").delete((req, res, next) => {
  const c = new testimonials();
  return c.DeleteTestimonial(req,res,next)
});
router.route("/:id").put((req, res, next) => {
  const c = new testimonials();
  return c.UpdateTestimonial(req, res, next);
});


export default router;
