# GFashion-Backend

A robust and scalable backend API for the GFashion e-commerce platform built with Node.js, Express.js, and MongoDB. This RESTful API powers both the admin dashboard and customer mobile application, providing comprehensive e-commerce functionality with secure authentication, payment processing, and cloud-based image management.

## 🚀 Features

**Authentication & Authorization**
- JWT-based user authentication
- Role-based access control (Admin, Customer)
- Secure password hashing with bcrypt
- OAuth integration support
- Password reset functionality

**User Management**
- Customer registration and profile management
- Admin user controls
- User activity tracking
- Account verification and security

**Product Management**
- Complete product CRUD operations
- Category and subcategory management
- Product variants (size, color, style)
- Inventory tracking and stock management
- Product search and filtering
- Bulk product operations

**Order Processing**
- Order creation and management
- Order status tracking and updates
- Payment integration and processing
- Shipping address management
- Order history and analytics

**Review System**
- Customer product reviews and ratings
- Review moderation and management
- Photo reviews with image upload
- Review analytics and aggregation

**Image Management**
- Cloudinary integration for image storage
- Automatic image optimization and transformation
- Multiple image formats support
- Image upload validation and security

**Analytics & Reporting**
- Sales analytics and revenue tracking
- User behavior analytics
- Product performance metrics
- Custom reporting endpoints

## 🛠️ Tech Stack

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Cloudinary** - Cloud-based image management
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing
- **Multer** - File upload handling
- **Nodemailer** - Email service

## 📋 Prerequisites

Before running this project, make sure you have:

- Node.js (version 14.0 or higher)
- npm or yarn package manager
- MongoDB database (local or MongoDB Atlas)
- Cloudinary account for image storage
- Stripe account for payment processing

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/HiQuang210/GFashion-Backend.git
   cd GFashion-Backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```
   
   Configure your environment variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database Configuration
   MONGODB_URI=mongodb://localhost:27017/GFashion
   # or for MongoDB Atlas:
   # MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net
   
   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here
   JWT_EXPIRE=7d
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Email Configuration
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   
   # CORS Configuration
   CLIENT_URL=http://localhost:3000
   ADMIN_URL=http://localhost:5173
   ```

## 🏃‍♂️ Running the Project

### Development Mode
```bash
npm run start:dev
# or
yarn start:dev
```
The server will start at `http://localhost:5000`

### Production Mode
```bash
npm start
# or
yarn start
```

### Database Setup
```bash
# If using local MongoDB, make sure MongoDB service is running
# For Windows:
net start MongoDB

# For macOS:
brew services start mongodb-community

# For Linux:
sudo systemctl start mongod
```

## 🔒 Security Features

- **Input Validation**: Comprehensive request validation using Joi
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Cross-origin resource sharing configuration
- **Data Sanitization**: NoSQL injection prevention
- **JWT Security**: Secure token-based authentication
- **Password Security**: Bcrypt hashing with salt rounds

## ☁️ Cloudinary Integration

The backend integrates with Cloudinary for efficient image management:

- **Automatic Upload**: Images are automatically uploaded to Cloudinary
- **Image Optimization**: Automatic format conversion and compression
- **Responsive Images**: Multiple size variants generation
- **Secure URLs**: Time-limited and signed URLs for security
- **Bulk Operations**: Support for multiple image uploads


## 🚀 Deployment

### Environment Setup
```bash
# Install PM2 for production process management
npm install -g pm2

# Start application with PM2
pm2 start server.js --name "GFashion-Backend"

# Monitor application
pm2 monitor
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run integration tests
npm run test:integration

# Run API tests
npm run test:api
```

## 📈 Monitoring & Logging

```bash
# View application logs
npm run logs

# Monitor API performance
npm run monitor

# Database performance monitoring
npm run db:monitor
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Write tests for your changes
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
