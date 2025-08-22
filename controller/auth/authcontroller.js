import "../../routes/auth.js";
import { Base } from "../../service/base.js";
import MailService from "../../service/mail.js";

export default class AuthController extends Base {
  constructor() {
    super();
  }

  async signup(req, res, next) {
    try {
      if (this.varify_req(req, ["username", "email", "password"])) {
        return this.send_res(res);
      }

      const { username, email, password } = req.body;

      // let profile_img = await this.uploadToCloudinary(
      //   req.files.profile_img,
      //   "profile_images"
      // );

      let hash_password = this.generate_password(password);
      const check = await this.selectOne(
        "SELECT * FROM user WHERE email = ? AND status = ?",
        [email, 1]
      );
      if (check) {
        this.s = 0;
        this.m = "Email already exist";
        return this.send_res(res);
      }

      const query = await this.insert(
        "INSERT INTO user (username,email,password) VALUES (?,?,?)",
        [username, email, hash_password]
      );
      if (query) {
        const apikey = this.generate_apikey(query);
        const token = this.generate_token(query);
        await this.insert(
          "INSERT INTO user_auth (user_id,apikey,token) VALUES (?,?,?)",
          [query, apikey, token]
        );
        const get_details = await this.selectOne(
          "SELECT * FROM user WHERE id = ?",
          [query]
        );
        get_details.user_auth = await this.selectOne(
          "SELECT * FROM user_auth WHERE user_id = ?",
          [query]
        );
        const mailService = new MailService();

        await mailService.sendMail({
          to: email,
          subject: "Welcome to Candleaf 🎉",
          templateName: "welcome-mail",
          data: {
            username: username,
            email: email,
          },
        });

        this.s = 1;
        this.m = "Signup Succesfully";
        this.r = get_details;
        return this.send_res(res);
      } else {
        return this.send_res(res);
      }
    } catch (err) {
      this.err = err.message;
      return this.send_res(res);
    }
  }

  async login(req, res, next) {
    try {
      if (this.varify_req(req, ["email", "password"])) {
        return this.send_res(res);
      }
      const { email, password } = req.body;

      const check = await this.selectOne(`select * from user where email = ?`, [
        email,
      ]);
      if (check) {
        let checkPass = this.check_password(check.password, password);
        if (checkPass) {
          const get_details = await this.selectOne(
            "SELECT * FROM user WHERE email = ?",
            [email]
          );

          get_details.user_auth = await this.selectOne(
            "SELECT * FROM user_auth WHERE user_id = ?",
            [get_details.id]
          );

          this.s = 1;
          this.m = "login successfully...";
          this.r = get_details;
          return this.send_res(res);
        } else {
          this.s = 0;
          this.m = "password wrong....";
          return this.send_res(res);
        }
      } else {
        this.s = 0;
        this.m = "email is not Exist !";
        return this.send_res(res);
      }
    } catch (error) {
      this.err = error.message;
    }
  }

 async forgotPass(req, res, next) {
  try {
    if (this.varify_req(req, ["email"])) {
      return this.send_res(res);
    }
    const { email } = req.body;

    // check user exist
    const user = await this.selectOne("SELECT * FROM user WHERE email = ?", [email]);
    if (!user) {
      this.s = 0;
      this.m = "Email not registered!";
      return this.send_res(res);
    }

    // generate OTP
    const secret = process.env.OTP_SECRET || "mySecretKey";
    const otp = Math.floor(100000 + Math.random() * 900000); // 6-digit
    const expiryTimestamp = Date.now() + 5 * 60 * 1000; // 5 min

    const rawData = `${email}${otp}${secret}${expiryTimestamp}`;
    const hash = await this.generateHash(rawData);

    // send email
    const mailService = new MailService();
    await mailService.sendMail({
      to: email,
      subject: "Password Reset OTP - Candleaf",
      templateName: "forgot-passmail",
      data: { email, otp },
    });

    this.s = 1;
    this.m = "OTP sent to your email";
    this.r = {
      hash,
      expiryTimestamp,
    };
    return this.send_res(res);
  } catch (error) {
    this.err = error.message;
    return this.send_res(res);
  }
}

async resetPass(req, res, next) {
  try {
    if (this.varify_req(req, ["otp", "hash", "expiryTimestamp", "newPassword", "email"])) {
      return this.send_res(res);
    }

    let { otp, hash, expiryTimestamp, newPassword, email } = req.body;
    const secret = process.env.OTP_SECRET || "mySecretKey";

    // check expiry
    if (Date.now() > Number(expiryTimestamp)) {
      this.s = 0;
      this.m = "OTP expired!";
      return this.send_res(res);
    }

    // verify hash
    const rawData = `${email}${otp}${secret}${expiryTimestamp}`;
    const isValid = await this.compareHash(rawData, hash);

    if (!isValid) {
      this.s = 0;
      this.m = "Invalid OTP!";
      return this.send_res(res);
    }

    // update new password
    const user = await this.selectOne("SELECT * FROM user WHERE email = ?", [email]);
    if (!user) {
      this.s = 0;
      this.m = "User not found!";
      return this.send_res(res);
    }

    const hash_password = this.generate_password(newPassword);
    await this.update("UPDATE user SET password = ? WHERE id = ?", [hash_password, user.id]);

    // ✅ Expire token immediately after success
    expiryTimestamp = 0;

    // send mail
    const mailService = new MailService();
    await mailService.sendMail({
      to: email,
      subject: "Password Reset Successful - Candleaf",
      templateName: "reset-passmail",
      data: { email }
    });

    this.s = 1;
    this.m = "Password reset successfully!";
    this.d = { expiryTimestamp }; // client ko 0 bhej do
    return this.send_res(res);
  } catch (error) {
    this.err = error.message;
    return this.send_res(res);
  }
}




}
