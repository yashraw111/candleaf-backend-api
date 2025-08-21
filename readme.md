Candleaf Backend API
This is the backend API for Candleaf, an e-commerce application for selling candles. It's built with Node.js and Express, and it uses a MySQL database.

Features
User Authentication: Signup and login functionality.
User Management: Get all users, get a single user, delete a user, and update a user's profile.
Product Management: Add, retrieve, update, and delete products. Products have details like price, description, stock, and other attributes.
Product Images: Upload, delete, and update product images, including a thumbnail. Images are uploaded to Cloudinary.
Shopping Cart: Add, get, update, and remove items from the cart.
Email Service: Sends a welcome email upon signup.
Push Notifications: Firebase-based push notification service.

Getting Started
Prerequisites
Node.js (v12 or higher)
npm

MySQL

Installation
Clone the repository:

Bash

git clone https://github.com/yashraw111/candleaf-backend-api.git
Navigate to the project directory:

Bash

cd candleaf-backend-api
Install the dependencies:

Bash

npm install
Set up your environment variables. Create a .env file in the root of the project and add the following variables:

Code snippet

# Environment (LOCAL, DEVELOPMENT, or PRODUCTION)
NODE_ENV=LOCAL

# Server Configuration
LOCAL_PORT=3000
LOCAL_API_URL=http://localhost:3000/api
LOCAL_ADMIN_URL=http://localhost:3000/admin
LOCAL_STATIC_ROUTE=static

# Database Configuration
LOCAL_DB_HOST=localhost
LOCAL_DB_USER=your_database_user
LOCAL_DB_PASS=your_database_password
LOCAL_DB_NAME=your_database_name
LOCAL_DB_CONN_LIMIT=100
LOCAL_DB_DATE_STRINGS=true

# Application Secret
APP_SECRET=your_app_secret

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# SMTP Configuration
LOCAL_SMTP_HOST=your_smtp_host
LOCAL_SMTP_PORT=465
LOCAL_SMTP_FROM=your_email_address
LOCAL_SMTP_FROM_NAME=Your Name
LOCAL_SMTP_USER=your_smtp_user
LOCAL_SMTP_PASS=your_smtp_password
LOCAL_SMTP_SECURE=true
Running the Application
To run the server in development mode with automatic restarts, use:

Bash

npm run dev
To run the server in production, use:

Bash

npm start
API Endpoints
All endpoints are prefixed with /api.

Authentication
POST /auth/signup: Create a new user account.

POST /auth/login: Log in a user.

User
GET /user/get-all: Get a paginated list of all users.

GET /user/get-single: Get a single user by their ID.

DELETE /user/: Delete a user by their ID.

PUT /user/edit_profile: Update a user's profile.

Product
POST /product/: Add a new product.

GET /product/allProduct: Get a paginated list of all products.

GET /product/:id: Get a single product by its ID.

PUT /product/:id: Update a product by its ID.

DELETE /product/:id: Delete a product by its ID.

Product Image
POST /product/image/upload: Upload images for a product.

DELETE /product/image/delete/:image_id: Delete a product image.

PUT /product/image/update/:image_id: Update a product image.

Cart
POST /cart/addtocart: Add a product to the cart.

GET /cart/: Get the user's cart.

PUT /cart/update/:id: Update the quantity of a cart item.

DELETE /cart/remove/:id: Remove an item from the cart.

PUT /cart/increment/:id: Increment the quantity of a cart item.

PUT /cart/decrement/:id: Decrement the quantity of a cart item.

Dependencies
You can find the full list of dependencies in the package.json file. Key dependencies include:

axios: For making HTTP requests.

bcrypt: For password hashing.

cloudinary: For image uploads.

cors: For enabling Cross-Origin Resource Sharing.

dotenv: For loading environment variables.

express: The web framework for Node.js.

express-fileupload: For handling file uploads.

firebase-admin: For push notifications.

mysql2: MySQL driver for Node.js.

nodemailer: For sending emails.

nodemon: For automatically restarting the server during development.

socket.io: For real-time communication.
