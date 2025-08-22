import { Base } from "../../service/base.js";

export default class UserController extends Base {
  constructor() {
    super();
  }
  async get_all(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 5;
      const offset = (page - 1) * limit;

      const totalUsersQuery = await this.select(
        "SELECT COUNT(*) as total FROM user"
      );
      const totalUsers = totalUsersQuery[0].total;
      const totalPages = Math.ceil(totalUsers / limit);

      const query = `
        SELECT * 
        FROM user 
        LIMIT ? 
        OFFSET ?
      `;
      const users = await this.select(query, [limit, offset]);

      this.s = 1;
      this.r = users;
      this.m = "all Users";
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async getSingleUser(req, res, next) {
    try {
      const { user_id } = req.query;

      const user = await this.selectOne(`SELECT * FROM user WHERE id = ?`, [
        user_id,
      ]);
      console.log(user);

      if (!user) {
        this.s = 0;
        this.m = "User not found.";
        return this.send_res(res);
      }

      this.s = 1;
      this.r = user;
      this.m = "Single User";
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }
  async deleteUser(req, res, next) {
    try {
      const { user_id } = req.query;
      const user = await this.selectOne(`SELECT * FROM user WHERE id = ?`, [
        user_id,
      ]);

      if (!user) {
        this.s = 0;
        this.m = "User not found.";
        return this.send_res(res);
      }

      await this.delete("DELETE FROM user WHERE id = ?", [user_id]);
      this.s = 1;
      this.r = user;
      this.m = "deleted User";
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async updateUser(req, res, next) {
    try {
      const { user_id } = req.query;
      const { username } = req.body;
      const user = await this.selectOne(`SELECT * FROM user WHERE id = ?`, [
        user_id,
      ]);
      let profile_img = user.profile_img || "";
      if (req.files) {
        profile_img = await this.uploadToCloudinary(
          req.files.profile_img,
          "profile_images"
        );
      }
      if (!user) {
        this.s = 0;
        this.m = "User not found.";
        return this.send_res(res);
      }
      await this.update(
        "UPDATE user SET username = ? ,profile_img =? WHERE id =?",
        [username, profile_img, user_id]
      );
      this.s = 1;
      this.r = user;
      this.m = "updated User";
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async changePass(req, res, next) {
    try {
      const user_id = req.user_id;

      const { old_pass, new_pass } = req.body;
      if (this.varify_req(req, ["old_pass", "new_pass"])) {
        return this.send_res(res);
      }

      const user = await this.selectOne("SELECT * FROM user where id = ?", [
        user_id,
      ]);

      const checkPass = await this.check_password(user?.password, old_pass);
      if (!checkPass) {
        this.s = 0;
        this.m = "incorrect old password";
        return this.send_res(res);
      }
      const hashPass = await this.generate_password(new_pass);
      await this.update("UPDATE user set password = ? where id = ?", [
        hashPass,
        user_id,
      ]);
      this.s = 1;
      this.m = "password updated ";
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }
}
