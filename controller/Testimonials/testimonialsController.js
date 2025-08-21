import { Base } from "../../service/base.js";

export default class testimonialsController extends Base{
    constructor(){
        super()
    }
     async CreateTestimonials(req,res,next){
       try {
         if(this.varify_req(req,["customer_name","quote","rating"],["avatar_url"])){
            return this.send_res(res)
        }
        const {customer_name,quote,rating} = req.body

        const avatar_image = await this.uploadMultipleToCloudinary(req.files.avatar_url,"testimonials")

        if(!avatar_image){
            this.m = "image upload failed"
            return this.send_res(res)
        }

        const query = "INSERT INTO testimonials (customer_name,quote,rating,avatar_url) VALUES (?,?,?,?)"
       const testimonials = await this.insert(query,[customer_name,quote,rating,avatar_image])

        this.s =1 ;
        this.m = "testimonials created successfully"
        this.r =testimonials
        return  this.send_res(res)
       } catch (error) {
        this.err = error.message
        return this.send_res(res)
       }
     }

       async GetTestimonials(req, res, next) {
    try {
      const query = "SELECT * FROM testimonials";
      const data = await this.select(query);

      this.s = 1;
      this.m = "Testimonials fetched successfully";
      this.r = data;
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }

      async DeleteTestimonial(req, res, next) {
    try {
      const { id } = req.params;
      const query = "DELETE FROM testimonials WHERE id = ?";
      const deleted = await this.delete(query, [id]);

      if (!deleted) {
        this.m = "Delete failed";
        return this.send_res(res);
      }

      this.s = 1;
      this.m = "Testimonial deleted successfully";
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }


   async GetSingleTestimonial(req, res, next) {
    try {
      if (this.varify_req(req, [], [])) return this.send_res(res);

      const { id } = req.params;
      const query = "SELECT * FROM testimonials WHERE id = ?";
      const data = await this.selectOne(query, [id]);

      if (!data) {
        this.m = "Testimonial not found";
        return this.send_res(res);
      }

      this.s = 1;
      this.m = "Testimonial fetched successfully";
      this.r = data;
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }

    async UpdateTestimonial(req, res, next) {
    try {
      const { id } = req.params;
      const { customer_name, quote, rating } = req.body;
      console.log(req.body)

      const testimonial = await this.selectOne("SELECT * from testimonials where id = ?",[id])

      let avatar_url = testimonial.avatar_url;
      if (req.files && req.files.avatar_url) {
        const avatar_image = await this.uploadMultipleToCloudinary(
          req.files.avatar_url,
          "testimonials"
        );
        avatar_url = avatar_image[0];
      }

      const query = await this.update("UPDATE testimonials SET customer_name = ?, quote = ?, rating = ?,avatar_url = ?  WHERE id = ?",[customer_name, quote, rating,avatar_url,id])

      this.s = 1;
      this.m = "Testimonial updated successfully";
     
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }

}