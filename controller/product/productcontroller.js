import { Base } from "../../service/base.js";

export default class ProductController extends Base {
  constructor() {
    super();
  }

  async AddProduct(req, res, next) {
    try {
      if (
        this.varify_req(req, [
          "pr_name",
          "pr_price",
          "pr_des",
          "stock_quantity",
          "wax",
          "fragrance",
          "burning_time",
          "dimension",
          "weight",
        ])
      ) {
        return this.send_res(res);
      }

      const {
        pr_name,
        pr_price,
        pr_des,
        stock_quantity,
        wax,
        fragrance,
        burning_time,
        dimension,
        weight,
      } = req.body;

      const query = await this.insert(
        `INSERT INTO products 
      (pr_name, pr_price, pr_des, stock_quantity, wax, fragrance, burning_time, dimension, weight) 
      VALUES (?,?,?,?,?,?,?,?,?)`,
        [
          pr_name,
          pr_price,
          pr_des,
          stock_quantity,
          wax,
          fragrance,
          burning_time,
          dimension,
          weight,
        ]
      );

      if (query) {
        this.s = 1;
        this.m = "Product created successfully. Now upload images.";
        this.r = { productId: query };
        return this.send_res(res);
      } else {
        return this.send_res(res);
      }
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }

  async singleProduct(req, res, next) {
    const { id } = req.params;
    try {
      const query = `
            SELECT *
            FROM products where id = ?
        `;
      const product = await this.selectOne(query, [id]);

      const images = await this.select(
        `SELECT * FROM product_img WHERE product_id = ?`,
        [id]
      );

      product.images = images;

      if (!product) {
        this.s = 0;
        this.m = "Product not found.";
        return this.send_res(res);
      }

      this.s = 1;
      this.m = "Product retrieved successfully";
      this.r = product;
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }
  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;
      const {
        pr_name,
        pr_price,
        pr_des,
        stock_quantity,
        wax,
        fragrance,
        burning_time,
        dimension,
        weight,
      } = req.body;

      const product = await this.selectOne(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );
      if (!product) {
        this.s = 0;
        this.m = "Product not found.";
        return this.send_res(res);
      }

      await this.update(
        `UPDATE products 
       SET pr_name = ?, pr_price = ?, pr_des = ?, stock_quantity = ?,
           wax = ?, fragrance = ?, burning_time = ?, dimension = ?, weight = ?
       WHERE id = ?`,
        [
          pr_name,
          pr_price,
          pr_des,
          stock_quantity,
          wax,
          fragrance,
          burning_time,
          dimension,
          weight,
          id,
        ]
      );

      this.s = 1;
      this.m = "Product updated successfully.";
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }
  async allProduct(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 8;
      const offset = (page - 1) * limit;

      // Step 1: Base Products
      const products = await this.select(
        `SELECT * FROM products WHERE is_active = TRUE LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      // Step 2: Attach images for each product
      for (let i = 0; i < products.length; i++) {
        const images = await this.select(
          `SELECT * FROM product_img WHERE product_id = ?`,
          [products[i].id]
        );
        products[i].images = images;
      }
      // Step 3: Pagination count
      const totalProductsQuery = await this.select(
        "SELECT COUNT(*) as total FROM products WHERE is_active = TRUE"
      );
      const totalProducts = totalProductsQuery[0].total;
      const totalPages = Math.ceil(totalProducts / limit);

      // Step 4: Response
      this.s = 1;
      this.m = "Products retrieved successfully";
      this.r = {
        pagination: {
          total_records: totalProducts,
          total_pages: totalPages,
          current_page: page,
          per_page: limit,
        },
        data: products,
      };
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }
  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      const product = await this.selectOne(
        "SELECT * FROM products WHERE id = ?",
        [id]
      );
      if (!product) {
        this.s = 0;
        this.m = "Product not found.";
        return this.send_res(res);
      }
      await this.delete("DELETE FROM product_img WHERE product_id = ?", [id]);
      await this.delete("DELETE FROM products WHERE id = ?", [id]);
      this.s = 1;
      this.m = "Product deleted successfully.";
      return this.send_res(res);
    } catch (error) {
      this.err = error.message;
      return this.send_res(res);
    }
  }
}
