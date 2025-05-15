const UserService = require("../services/UserService");
const JwtService = require("../services/JwtService");
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
      lastName
    });

    return res.status(response.status === "ERR" ? 400 : 200).json(response);
  } catch (e) {
    return res.status(500).json({ message: e.message });
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

    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      });
    }

    // Nếu đổi mật khẩu thì yêu cầu cả oldPassword và password mới
    if ((data.oldPassword && !data.password) || (!data.oldPassword && data.password)) {
      return res.status(400).json({
        status: "ERR",
        message: "Both old and new passwords are required to change password",
      });
    }

    const response = await UserService.updateUser(userId, data);

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

    if (!userId) {
      return res.status(400).json({
        status: "ERR",
        message: "User ID is required",
      });
    }

    const response = await UserService.adminUpdateUser(userId, data);
    return res.status(200).json(response);
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
      Number(limitUser) || 8,
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
    console.log("id", userId);
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
    console.log("id", userId);

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
    const action = req.query.action;
    const userId = req.user.id;
    const productId = req.body.productId;
    const color = req.body.color;
    const size = req.body.size;
    const quantity = req.body.quantity;

    if (!userId || !productId) {
      return res.status(200).json({
        status: "ERR",
        message: "User ID and Product ID are required",
      });
    }

    const response = await UserService.handleCartAction(action, userId, productId, color, size, quantity);

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
  loginUser,
  adminLoginUser,
  updateUser,
  adminUpdateUser,
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
