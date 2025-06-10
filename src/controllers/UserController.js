const UserService = require("../services/UserService");
const JwtService = require("../services/JwtService");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const User = require("../models/UserModel");

const createUser = async (req, res) => {
  try {
    const { email, password, phone, firstName, lastName } = req.body;

    const isValidEmail = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(email);

    if (!email || !password || !phone) {
      return res.status(400).json({
        status: "ERR",
        message: "Email, password, and phone are required",
      });
    } else if (!isValidEmail) {
      return res.status(400).json({
        status: "ERR",
        message: "Please enter a valid email address",
      });
    }

    const response = await UserService.createUser({
      email,
      password,
      phone,
      firstName,
      lastName,
      address: []  
    });

    return res.status(response.status === "ERR" ? 400 : 200).json(response);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

const requestEmailVerification = async (req, res) => {
  try {
    const { email, password, phone, firstName, lastName } = req.body;
    const isValidEmail = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
        console.log("SERVER_URL:", process.env.SERVER_URL);
    if (!email || !password || !phone || !isValidEmail) {
      return res.status(400).json({ status: "ERR", message: "Invalid input" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ status: "ERR", message: "Email already exists" });
    }

    const token = jwt.sign(
      { email, password, phone, firstName, lastName },
      process.env.EMAIL_SECRET,
      { expiresIn: "15m" }
    );

    const verifyLink = `${process.env.SERVER_URL}/api/user/verify-email?token=${token}`;
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false, 
      },
    });

    await transporter.sendMail({
      from: `"GFashion" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify your email",
      html: `<p>Click <a href="${verifyLink}">here</a> to verify your email.</p>`,
    });

    return res.status(200).json({ status: "OK", message: "Verification email sent" });
  } catch (e) {
    return res.status(500).json({ status: "ERR", message: e.message });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).send(`
        <h2 style="color: red; font-family: sans-serif;">Missing token</h2>
      `);
    }

    const decoded = jwt.verify(token, process.env.EMAIL_SECRET);

    const response = await UserService.createUser({
      email: decoded.email,
      password: decoded.password,
      phone: decoded.phone,
      firstName: decoded.firstName,
      lastName: decoded.lastName,
    });

    if (response.status === "ERR") {
      return res.status(400).send(`
        <h2 style="color: red; font-family: sans-serif;">${response.message}</h2>
      `);
    }

    return res.send(`
      <div style="font-family: sans-serif; max-width: 500px; margin: 50px auto; text-align: center;">
        <h2 style="color: green;">🎉 Email verification successful!</h2>
        <p>You can now login to our app with your new account.</p>
      </div>
    `);
  } catch (e) {
    return res.status(400).send(`
      <h2 style="color: red; font-family: sans-serif;">Invalid or expired token</h2>
    `);
  }
};

const validateLoginInput = (email, password) => {
  if (!email || !password) {
    return {
      isValid: false,
      error: {
        status: "ERR",
        message: "Email and password are required",
      }
    };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: {
        status: "ERR",
        message: "Invalid email format",
      }
    };
  }

  return { isValid: true };
};

const handleLoginRequest = async (req, res, requireAdmin = false) => {
  try {
    const { email, password } = req.body;

    const validation = validateLoginInput(email, password);
    if (!validation.isValid) {
      return res.status(400).json(validation.error);
    }

    const response = await UserService.loginUser({
      email: email.toLowerCase().trim(),
      password,
      requireAdmin
    });

    if (response.status === "ERR") {
      let statusCode = 401;
      if (response.message.includes("not found")) statusCode = 404;
      else if (response.message.includes("Admin privileges") || response.message.includes("deactivated")) statusCode = 403;
      else if (response.message.includes("password")) statusCode = 401;

      return res.status(statusCode).json(response);
    }

    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: e.message || "Internal server error",
    });
  }
};

const loginUser = (req, res) => handleLoginRequest(req, res, false);
const adminLoginUser = (req, res) => handleLoginRequest(req, res, true);

const debugUser = async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ email }).lean();

    if (!user) return res.status(404).json({ message: 'User not found' });

    return res.json({
      email: user.email,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      hasPassword: !!user.password
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const data = req.body;
    const file = req.file; 

    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      });
    }

    const response = await UserService.updateUserById(userId, data, file);

    return res.status(response.status === "ERR" ? 400 : 200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: e.message,
    });
  }
};

const adminUpdateUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const data = req.body;
    const file = req.file; 

    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      });
    }

    const response = await UserService.adminUpdateUser(userId, data, file);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: e.message,
    });
  }
};

const changePassword = async (req, res) => {
  try {
    const userId = req.params.id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        status: "ERR",
        message: "Both old and new passwords are required",
      });
    }

    const response = await UserService.changePassword(userId, oldPassword, newPassword);

    return res.status(response.status === "ERR" ? 400 : 200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: e.message,
    });
  }
};

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!email || !isValidEmail) {
      return res.status(400).json({
        status: "ERR",
        message: "Please enter a valid email address",
      });
    }

    const response = await UserService.requestPasswordReset(email);
    
    return res.status(response.status === "ERR" ? 400 : 200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: e.message,
    });
  }
};

const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({
        status: "ERR",
        message: "Email and verification code are required",
      });
    }

    const response = await UserService.verifyResetCode(email, code);
    
    return res.status(response.status === "ERR" ? 400 : 200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: e.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    
    if (!email || !code || !newPassword) {
      return res.status(400).json({
        status: "ERR",
        message: "Email, verification code, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        status: "ERR",
        message: "Password must be at least 6 characters long",
      });
    }

    const response = await UserService.resetPassword(email, code, newPassword);
    
    return res.status(response.status === "ERR" ? 400 : 200).json(response);
  } catch (e) {
    return res.status(500).json({
      status: "ERR",
      message: e.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(200).json({
        status: "ERR",
        message: "User ID is required",
      });
    }
    console.log("id", userId);
    const response = await UserService.deleteUser(userId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const getAllUser = async (req, res) => {
  try {
    const { limitUser, page } = req.query;
    const currentUserId = req.user?.id;
    
    const response = await UserService.getAllUser(
      Number(limitUser) || 50,
      Number(page) || 0,
      currentUserId 
    );
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

const getDetailUser = async (req, res) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(200).json({
        status: "ERR",
        message: "User ID is required",
      });
    }
    // console.log("id", userId);
    const response = await UserService.getDetailUser(userId);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e,
    });
  }
};

// favorite controllers
const getUserFavorites = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(200).json({
        status: "ERR",
        message: "User ID is required",
      });
    }

    const response = await UserService.getUserFavorites(userId);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(404).json({
      message: error,
    });
  }
}

const handleFavoriteAction = async (req, res) => {
  try {
    const action = req.query.action;
    const userId = req.user.id;
    const productId = req.query.productId;

    if (!userId || !productId) {
      return res.status(200).json({
        status: "ERR",
        message: "User ID and Product ID are required",
      });
    }

    const response = await UserService.handleFavoriteAction(action, userId, productId);

    if (response.status === "ERR") {
      return res.status(400).json(response);
    }
    return res.status(200).json(response);
  } catch (error) {
    return res.status(404).json({
      message: error,
    });
  }
}

const getUserCart = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(200).json({
        status: "ERR",
        message: "User ID is required",
      });
    }

    const response = await UserService.getUserCart(userId);
    return res.status(200).json(response);
  } catch (error) {
    return res.status(404).json({
      message: error,
    });
  }
};

const handleCartAction = async (req, res) => {
  try {
    const { action, productId, color, size, quantity } = req.body;
    const userId = req.user?.id || req.body.userId; 

    if (!userId || !productId) {
      return res.status(400).json({
        status: "ERR",
        message: "User ID and Product ID are required",
      });
    }

    const response = await UserService.handleCartAction(
      action,
      userId,
      productId,
      color,
      size,
      quantity
    );

    return res.status(response.status === "OK" ? 200 : 400).json(response);
  } catch (error) {
    return res.status(500).json({
      status: "ERR",
      message: error.message || "Internal Server Error",
    });
  }
};

const refreshToken = async (req, res) => {
  try {
    const token = req.headers.token.split(" ")[1];

    if (!token) {
      return res.status(200).json({
        status: "ERR",
        message: "The token is required",
      });
    }
    //console.log('id', userId)
    const response = await JwtService.refreshTokenJwtService(token);
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
};

const getDashboard = async (req, res) => {
  try {
    const response = await UserService.getDashboard();
    return res.status(200).json(response);
  } catch (e) {
    return res.status(404).json({
      message: e.message,
    });
  }
}

module.exports = {
  createUser,
  requestEmailVerification,
  verifyEmail,
  loginUser,
  adminLoginUser,
  updateUser,
  adminUpdateUser,
  changePassword,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  debugUser,
  deleteUser,
  getAllUser,
  getDetailUser,
  getUserFavorites,
  handleFavoriteAction,
  getUserCart,
  handleCartAction,
  refreshToken,
  getDashboard
};
