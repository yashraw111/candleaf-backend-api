import { POOL } from "../config/database.js";
export const authMiddleware = async (req, res, next) => {
  try {
    const apikey = req.headers.apikey || req.query.apikey;
    const token = req.headers.token || req.query.token;

    if (!apikey || !token) {
      return res.status(401).json({
        s: 0,
        m: "apikey and token are required",
        r: null,
        err: null,
      });
    }

    const [rows] = await POOL.query(
      `SELECT user_id FROM user_auth WHERE apikey = ? AND token = ?`,
      [apikey, token]
    );

    if (!rows.length) {
      return res.status(401).json({
        s: 0,
        m: "Invalid apikey or token",
        r: null,
        err: null,
      });
    }

    // 👇 yaha user_id set kar rahe hai
    req.user_id = rows[0].user_id;

    next();
  } catch (error) {
    return res.status(500).json({
      s: 0,
      m: "Internal server error",
      r: null,
      err: error.message,
    });
  }
};
