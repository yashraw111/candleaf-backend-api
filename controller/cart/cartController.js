import { CONFIG } from "../../config/flavour.js";
import { Base } from "../../service/base.js";

export default class CartController extends Base {
  constructor() {
    super();
  }

  //? add to cart
async addToCart(req, res, next) {
  try {
    const { product_id, quantity } = req.body;
    const user_id = req.user_id; // 👈 ab middleware se aayega

    if (this.varify_req(req, ["product_id", "quantity"])) {
      return this.send_res(res);
    }

    const existing = await this.selectOne(
      "SELECT * FROM cart where product_id = ? AND user_id = ?",
      [product_id, user_id]
    );

    if (existing) {
      await this.update(
        "UPDATE cart SET quantity = quantity + ? WHERE id = ?",
        [quantity, existing.id]
      );
    } else {
      await this.insert(
        "INSERT INTO cart (user_id, product_id, quantity) VALUES (?,?,?)",
        [user_id, product_id, quantity]
      );
    }

    this.s = 1;
    this.m = "Product added to cart successfully.";
    return this.send_res(res);
  } catch (error) {
    this.err = error.message;
    return this.send_res(res);
  }
}

  //? get all cart with product
async getCart(req, res) {
  try {
    const user_id = req.user_id; // 👈 ab yaha se le rahe hai

    const items = await this.select(`SELECT * from cart where user_id = ?`, [
      user_id,
    ]);

    for (let i = 0; i < items.length; i++) {
      const product = await this.selectOne(
        "select * from products where id = ?",
        [items[i].product_id]
      );
      const images = await this.select(
        "SELECT * FROM product_img WHERE product_id = ?",
        [items[i].product_id]
      );
      items[i].cartProduct = product;
      items[i].images = images;
    }

    this.s = 1;
    this.m = "Cart fetched successfully";
    this.r = items;
    return this.send_res(res);
  } catch (err) {
    this.err = err.message;
    return this.send_res(res);
  }
}


  //? update cart
  async updateCart(req, res) {
    try {
      const { id } = req.params; //! cart id
      const { quantity } = req.body;

      await this.update("UPDATE cart SET quantity = ? WHERE id = ?", [
        quantity,
        id,
      ]);

      this.s = 1;
      this.m = "Cart updated successfully";
      return this.send_res(res);
    } catch (err) {
      this.err = err.message;
      return this.send_res(res);
    }
  }

  //? remove From Cart // cart id

  async removeFromCart(req, res) {
    try {
      const { id } = req.params; //! cart id

      await this.delete("DELETE FROM cart WHERE id = ?", [id]);

      this.s = 1;
      this.m = "Item removed from cart successfully";
      return this.send_res(res);
    } catch (err) {
      this.err = err.message;
      return this.send_res(res);
    }
  }

  //?  Increment quantity
  async incrementCart(req, res) {
    try {
      const { id } = req.params; // cart_id

      await this.update(
        "UPDATE cart SET quantity = quantity + 1 WHERE id = ?",
        [id]
      );

      this.s = 1;
      this.m = "Quantity increased";
      return this.send_res(res);
    } catch (err) {
      this.err = err.message;
      return this.send_res(res);
    }
  }
  //?  Decrement quantity

  async decrementCart(req, res) {
    try {
      const { id } = req.params;

      const cartItem = await this.selectOne(
        "SELECT quantity FROM cart WHERE id = ?",
        [id]
      );

      if (!cartItem) {
        this.m = "Cart item not found";
        return this.send_res(res);
      }

      if (cartItem.quantity > 1) {
        await this.update(
          "UPDATE cart SET quantity = quantity - 1 WHERE id = ?",
          [id]
        );
        this.s = 1;
        this.m = "Quantity decreased";
      } else {
        this.s = 0;
        this.m = "Minimum quantity is 1";
      }

      return this.send_res(res);
    } catch (err) {
      this.err = err.message;
      return this.send_res(res);
    }
  }
}
