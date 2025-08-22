import { Base } from "../../service/base.js";
import MailService from "../../service/mail.js";
import { buildInvoicePDF } from "../../service/pdfService.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { CONFIG } from "../../config/flavour.js";
// Import the CONFIG object

// Use the CONFIG object to initialize Razorpay
const razorpay = new Razorpay({
  key_id: CONFIG.RAZORPAY_KEY_ID,
  key_secret: CONFIG.RAZORPAY_KEY_SECRET,
});

export default class OrderController extends Base {
  constructor() {
    super();
  }
  async checkout(req, res, next) {
    try {
      const user_id = req.user_id;
      const {
        payment_method,
        shipping_method,
        shipping_address,
        billing_address,
      } = req.body;

      if (
        this.varify_req(req, [
          "payment_method",
          "shipping_method",
          "shipping_address",
          "billing_address",
        ])
      ) {
        return this.send_res(res);
      } // 🛒 Cart Items

      const cartItems = await this.select(
        "SELECT c.product_id, c.quantity, p.pr_price, p.pr_name FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?",
        [user_id]
      );

      if (cartItems.length === 0) {
        this.m = "Your cart is empty!";
        return this.send_res(res);
      } // 💰 Total

      const totalAmount = cartItems.reduce(
        (sum, item) => sum + item.pr_price * item.quantity,
        0
      ); // 📝 Create Order (status = pending)

      const orderId = await this.insert(
        "INSERT INTO orders (user_id, total_amount, status, payment_method, shipping_method, shipping_address, billing_address) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          user_id,
          totalAmount,
          "pending",
          payment_method,
          shipping_method,
          shipping_address,
          billing_address,
        ]
      ); // 📦 Add Order Items

      for (let item of cartItems) {
        await this.insert(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
          [orderId, item.product_id, item.quantity, item.pr_price]
        );
        await this.update(
          "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
          [item.quantity, item.product_id]
        );
      } // 🔑 Razorpay Order (if payment_method = razorpay)

      let razorpayOrder = null;
      if (payment_method === "razorpay") {
        const options = {
          amount: totalAmount * 100, // in paise
          currency: "INR",
          receipt: `order_rcptid_${orderId}`,
        };
        razorpayOrder = await razorpay.orders.create(options); // 💾 Insert Payment Record

        await this.insert(
          "INSERT INTO payments (order_id, user_id, amount, payment_method, razorpay_order_id, status) VALUES (?, ?, ?, ?, ?, ?)",
          [
            orderId,
            user_id,
            totalAmount,
            "razorpay",
            razorpayOrder.id,
            "pending",
          ]
        );
      }

      this.s = 1;
      this.m = "Order created successfully!";
      this.r = {
        order_id: orderId,
        razorpay_order_id: razorpayOrder?.id || null, // Use the CONFIG object here as well
        razorpay_key_id: CONFIG.RAZORPAY_KEY_ID,
        amount: totalAmount,
        currency: "INR",
      };
      return this.send_res(res);
    } catch (err) {
      this.err = err.message;
      console.error("Checkout Error:", err);
      return this.send_res(res);
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const order_id = req.params.id;
      const { status } = req.body; // pending, paid, shipped, delivered, cancelled

      const allowedStatus = [
        "pending",
        "paid",
        "shipped",
        "delivered",
        "cancelled",
      ];
      if (!allowedStatus.includes(status)) {
        this.m = "Invalid status value";
        return this.send_res(res);
      }

      await this.update("UPDATE orders SET status = ? WHERE id = ?", [
        status,
        order_id,
      ]);

      this.s = 1;
      this.m = `Order status updated to ${status}`;
      return this.send_res(res);
    } catch (err) {
      this.err = err.message;
      return this.send_res(res);
    }
  }

  async myAllOrders(req, res, next) {
    try {
      const user_id = req.user_id;

      const orders = await this.select(
        "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
        [user_id]
      );

      if (orders.length === 0) {
        this.s = 1;
        this.m = "You have no orders yet.";
        this.r = [];
        return this.send_res(res);
      }

      for (let order of orders) {
        console.log(order);

        const items = await this.select(
          `SELECT 
       oi.id AS order_item_id,
       oi.quantity,
       oi.price AS item_price,
       p.id AS product_id,
       p.pr_name,
       p.pr_price
     FROM order_items oi
     JOIN products p ON oi.product_id = p.id
     WHERE oi.order_id = ?`,
          [order.id]
        );

        order.items = items;
      }

      this.s = 1;
      this.m = "All orders retrieved successfully.";
      this.r = orders;
      return this.send_res(res);
    } catch (err) {
      this.err = err.message;
      return this.send_res(res);
    }
  }

  async verifyPayment(req, res) {
    try {
      const {
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        order_id,
      } = req.body;

      const body = razorpay_order_id + "|" + razorpay_payment_id; // Use the CONFIG object for the secret key
      const expectedSignature = crypto
        .createHmac("sha256", CONFIG.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature === razorpay_signature) {
        // ✅ Success → Update payment & order
        await this.update(
          "UPDATE payments SET status = ?, transaction_id = ? WHERE razorpay_order_id = ?",
          ["success", razorpay_payment_id, razorpay_order_id]
        );
        await this.update("UPDATE orders SET status = ? WHERE id = ?", [
          "paid",
          order_id,
        ]); // 👤 Fetch User

        const user = await this.selectOne(
          "SELECT email, username FROM user WHERE id = ?",
          [req.user_id]
        );
        const order = await this.selectOne(
          "SELECT * FROM orders WHERE id = ?",
          [order_id]
        );
        const items = await this.select(
          "SELECT * FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?",
          [order_id]
        ); // 🧾 Invoice PDF

        const pdfBuffer = await this.buildInvoicePDF(
          {
            id: order_id,
            shipping_address: order.shipping_address,
            total_amount: order.total_amount,
            items,
          },
          user
        ); // 📧 Send Mail

        const mailService = new MailService();
        await mailService.sendMail({
          to: user.email,
          subject: `Order Confirmed - #${order_id}`,
          templateName: "order-confirmation",
          data: {
            username: user.username,
            orderId: order_id,
            totalAmount: order.total_amount,
            shipping_address: order.shipping_address,
            items,
          },
          attachments: [
            {
              filename: `invoice-${order_id}.pdf`,
              content: pdfBuffer,
              contentType: "application/pdf",
            },
          ],
        });

        this.s = 1;
        this.m = "Payment verified & Order confirmed!";
        return this.send_res(res);
      } else {
        // ❌ Fail
        await this.update(
          "UPDATE payments SET status = ? WHERE razorpay_order_id = ?",
          ["failed", razorpay_order_id]
        );
        await this.update("UPDATE orders SET status = ? WHERE id = ?", [
          "failed",
          order_id,
        ]);

        this.s = 0;
        this.m = "Payment verification failed!";
        return this.send_res(res);
      }
    } catch (err) {
      this.err = err.message;
      return this.send_res(res);
    }
  }
}
