import { CONFIG } from "../config/flavour.js";
import { POOL } from "../config/database.js";
import path from "path";
import crypto from "crypto";
import cloudinary from "../config/cloudinary.js";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from 'pdfkit'; // <-- ADD THIS IMPORT

class Base {
  constructor() {
    this.s = 0;
    this.m = "Something went wrong please try again...";
    this.r = null;
    this.c = null;
    this.err = null;
    this.db = POOL;
  }

  // varify required perms
  varify_req(req, perm, media = []) {
    const is_required = [];
    const p = { ...req.body, ...req.params, ...req.query };

    for (const k of perm) {
      if (!p.hasOwnProperty(k) || (p[k] != null && p[k].length <= 0)) {
        is_required.push(k);
      }
    }

    for (const m of media) {
      if (!req.files || !req.files[m]) {
        is_required.push(m);
      }
    }

    if (is_required.length > 0) {
      this.m = `Required : ${is_required.join(" ")}`;
      this.s = 0;
      return true;
    }
    return false;
  }

  // send response
  send_res(res) {
    return res.json({
      s: this.s,
      m: this.m,
      r: this.r,
      c: this.c,
      err: this.err,
    });
  }

  // generate password
  generate_password(data) {
    return crypto
      .createHmac("sha256", `${CONFIG.APP_SECRET}`)
      .update(data)
      .digest("hex");
  }

  // check password
  check_password(hex, data) {
    return (
      crypto
        .createHmac("sha256", `${CONFIG.APP_SECRET}`)
        .update(data)
        .digest("hex") === hex
    );
  }

  encrypt_password(password) {
    const algorithm = "aes-256-cbc";
    const key = crypto.createHash("sha256").update(CONFIG.APP_SECRET).digest();
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(password, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
  }

  decrypt_password(encryptedPassword) {
    const algorithm = "aes-256-cbc";
    const key = crypto.createHash("sha256").update(CONFIG.APP_SECRET).digest();

    const parts = encryptedPassword.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const encrypted = parts[1];

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }

  validate_password(encrypted, plainPassword) {
    const decrypted = this.decrypt_password(encrypted);

    return decrypted === plainPassword;
  }

  // generate apikey
  generate_apikey(user_id) {
    return crypto
      .createHmac("sha256", `${CONFIG.APP_SECRET}`)
      .update(user_id.toString())
      .digest("hex");
  }

  // generate token
  generate_token(user_id) {
    return crypto
      .createHmac("md5", `${CONFIG.APP_SECRET}`)
      .update(user_id.toString())
      .digest("hex");
  }

  // random token
  generate_random_string() {
    return crypto.randomBytes(16).toString("hex");
  }

  async buildInvoicePDF(order, user) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => {
      const pdfData = Buffer.concat(buffers);
      resolve(pdfData);
    });
    doc
      .fillColor("#333333")
      .fontSize(26)
      .text(" Candleaf", 50, 50, { align: "left", bold: true })
      .fontSize(12)
      .fillColor("#666666")
      .text("Official Invoice", { align: "left" });

    // Right corner invoice meta
    doc
      .fontSize(10)
      .fillColor("#000000")
      .text(`Invoice ID: #${order.id}`, 400, 60, { align: "right" })
      .text(
        `Order Date: ${new Date(order.created_at || Date.now()).toLocaleDateString()}`,
        400,
        75,
        { align: "right" }
      );

    doc.moveDown(2);

    // === Customer Info ===
    doc
      .fontSize(14)
      .fillColor("#222222")
      .text("Billing Information", 50, 140, { underline: true });

    doc
      .fontSize(12)
      .fillColor("#000000")
      .text(user.username || "Guest User", 50, 160)
      .text(order.shipping_address || "No address provided", 50, 175);

    doc.moveDown(2);

    // === Table Headers ===
    const tableTop = 220;
    doc
      .fontSize(12)
      .fillColor("#444444")
      .text("Product", 50, tableTop)
      .text("Quantity", 260, tableTop, { width: 90, align: "right" })
      .text("Price", 360, tableTop, { width: 90, align: "right" })
      .text("Total", 460, tableTop, { width: 90, align: "right" });
    // Header line
    doc
      .moveTo(50, tableTop + 15)
      .lineTo(550, tableTop + 15)
      .strokeColor("#aaaaaa")
      .stroke();

    // === Table Rows ===
    let position = tableTop + 30;
    order.items.forEach((item, i) => {
      const itemPrice = item.pr_price || item.price || 0;
      const total = itemPrice * item.quantity;

      doc
        .fontSize(10)
        .fillColor("#000000")
        .text(`${i + 1}. ${item.pr_name}`, 50, position)
        .text(item.quantity, 260, position, { width: 90, align: "right" })
        .text(`$${itemPrice.toFixed(2)}`, 360, position, { width: 90, align: "right" })
        .text(`$${total.toFixed(2)}`, 460, position, { width: 90, align: "right" });

      position += 25;
      doc
        .moveTo(50, position - 5)
        .lineTo(550, position - 5)
        .strokeColor("#f0f0f0")
        .stroke();
    });
    position += 20;
    doc
      .fontSize(14)
      .fillColor("#000000")
      .text(`Grand Total: $${order.total_amount.toFixed(2)}`, 460, position, {
        width: 90,
        align: "right",
      });
    doc.moveDown(6);
    doc
      .fontSize(10)
      .fillColor("#666666")
      .text("Thank you for shopping with Candleaf 🕯️", { align: "center" })
      .moveDown()
      .fontSize(8)
      .text("This is a system-generated invoice. No signature required.", {
        align: "center",
      });

    doc.end();
  });
}
// generate a salted hash
async generateHash(data) {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(data, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(salt + ":" + derivedKey.toString("hex")); // store salt + hash
    });
  });
}

// compare input with stored hash
async compareHash(data, storedHash) {
  return new Promise((resolve, reject) => {
    const [salt, key] = storedHash.split(":");
    crypto.scrypt(data, salt, 64, (err, derivedKey) => {
      if (err) return reject(err);
      resolve(key === derivedKey.toString("hex"));
    });
  });
}

  generate_strong_password(length = 8) {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    // Special characters: anything not a word character or whitespace
    const special = "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
    const all = upper + lower + digits + special;

    const regex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w\s]).{8,}$/;
    
    let password = "";
    do {
      let chars = [
        upper[Math.floor(Math.random() * upper.length)],
        lower[Math.floor(Math.random() * lower.length)],
        digits[Math.floor(Math.random() * digits.length)],
        special[Math.floor(Math.random() * special.length)],
      ];
      for (let i = chars.length; i < length; i++) {
        chars.push(all[Math.floor(Math.random() * all.length)]);
      }
      // Shuffle
      for (let i = chars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [chars[i], chars[j]] = [chars[j], chars[i]];
      }
      password = chars.join("");
    } while (!regex.test(password));
    return password;
  }

  // insert query
  async insert(query, prms) {
    try {
      var rows = await this.db.query(query, prms);
      return rows[0].insertId;
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  // selectone query
  async selectOne(query, prms) {
    try {
      var rows = await this.db.query(query, prms);
      return rows[0][0] ? rows[0][0] : null;
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  // select query
  async select(query, prms) {
    try {
      var rows = await this.db.query(query, prms);
      return rows[0] ? rows[0] : [];
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  // update query
  async update(query, prms) {
    try {
      await this.db.query(query, prms);
      return true;
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  // delete query
  async delete(query, prms) {
    try {
      await this.db.query(query, prms);
      return true;
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  async begin_transaction() {
    try {
      await this.db.query("START TRANSACTION");
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  async commit() {
    try {
      await this.db.query("COMMIT");
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  async rollback() {
    try {
      await this.db.query("ROLLBACK");
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  // destroy
  async destroy() {
    try {
      this.db.destroy();
      return true;
    } catch (err) {
      console.log(err.message);
      this.err = err.message;
      return false;
    }
  }

  // Upload file
  async upload_file(file, pathDirectory) {
    try {
      if (!file) {
        return null;
      }
      const extension = path.extname(file.name);
      const fileName = crypto.randomBytes(16).toString("hex") + extension;
      const uploadPath = `./public/uploads/${pathDirectory}/${fileName}`;
      await file.mv(uploadPath);
      return `/uploads/${pathDirectory}/${fileName}`;
    } catch (err) {
      this.error = err.message;
      console.error(err.message);
      return null;
    }
  }

  async uploadMultipleToCloudinary(files, pathDirectory) {
  try {
    if (!files) return [];

    const folderPath = pathDirectory || "general";
    const urls = [];

    if (Array.isArray(files)) {
      for (let file of files) {
        const uniqueName = uuidv4();
        const result = await cloudinary.v2.uploader.upload(
          file.tempFilePath || file.path || file,
          {
            folder: folderPath,
            public_id: uniqueName,
            resource_type: "auto",
          }
        );
        urls.push(result.secure_url);
      }
    } else {
      // Agar sirf ek file ho
      const uniqueName = uuidv4();
      const result = await cloudinary.v2.uploader.upload(
        files.tempFilePath || files.path || files,
        {
          folder: folderPath,
          public_id: uniqueName,
          resource_type: "auto",
        }
      );
      urls.push(result.secure_url);
    }

    return urls;
  } catch (err) {
    console.error("Cloudinary Upload Error:", err.message);
    return [];
  }
}

}

export { Base };
