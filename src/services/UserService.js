const User = require("../models/UserModel");
const bcrypt = require("bcrypt");
const { generalAccessToken, generalRefreshToken } = require("./JwtService");

const createUser = (newUser) => {
  return new Promise(async (resolve, reject) => {
    const { email, password, confirmPassword } = newUser;
    try {
      const checkUser = await User.findOne({
        email: email,
      });
      if (checkUser !== null) {
        resolve({
          status: "ERR",
          message: "The email is already exist!",
        });
      }

      const hash = bcrypt.hashSync(password, 10);
      const createdUser = await User.create({
        email,
        password: hash,
      });

      const access_token = await generalAccessToken({
        id: createdUser._id,
        isAdmin: createdUser.isAdmin,
      });

      const refresh_token = await generalRefreshToken({
        id: createdUser._id,
        isAdmin: createdUser.isAdmin,
      });

      createdUser.refresh_token = refresh_token;
      await createdUser.save();

      if (createdUser) {
        resolve({
          status: "OK",
          message: "Success",
          access_token,
          userInfo: {
            email: createdUser.email,
            phone: createdUser.phone || "NA",
            address: createdUser.address || "NA",
            favoriteSize: checkUser.favorite.length || 0,
            cartSize: createdUser.cart.length || 0,
          },
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const loginUser = ({ email, password }) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({ email });
      if (!checkUser) {
        return resolve({
          status: "ERR",
          message: "User undefined",
        });
      }

      const comparePassword = bcrypt.compareSync(password, checkUser.password);
      if (!comparePassword) {
        return resolve({
          status: "ERR",
          message: "Incorrect password",
        });
      }

      const access_token = await generalAccessToken({
        id: checkUser._id,
        isAdmin: checkUser.isAdmin,
      });

      const refresh_token = await generalRefreshToken({
        id: checkUser._id,
        isAdmin: checkUser.isAdmin,
      });

      resolve({
        status: "OK",
        message: "Login successful",
        access_token,
        userInfo: {
          email: checkUser.email,
          phone: checkUser.phone || "NA",
          address: checkUser.address || "NA",
          favorite: checkUser.favorite || [],
          cartSize: checkUser.cart.length || 0,
        },
      });
    } catch (e) {
      reject(e);
    }
  });
};

const updateUser = (id, data) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({
        _id: id,
      });

      if (checkUser === null) {
        resolve({
          status: "OK",
          message: "The user is not defined!",
        });
      }

      console.log("data before change: ", data);
      if (data.oldPassword) {
        const comparePassword = bcrypt.compareSync(
          data.oldPassword,
          checkUser.password
        );
        if (!comparePassword) {
          return resolve({
            status: "ERR",
            message: "Incorrect password",
          });
        }
        delete data.oldPassword;
        console.log("data: ", data);

        const hash = bcrypt.hashSync(data.password, 10);
        data.password = hash;
      }

      //console.log('b4 update')
      await User.findByIdAndUpdate(id, data, { new: true });
      //console.log('updatedUser here', updateUser)

      resolve({
        status: "OK",
        message: "Success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const deleteUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const checkUser = await User.findOne({
        _id: id,
      });
      console.log("checkUser", checkUser);
      if (checkUser === null) {
        resolve({
          status: "OK",
          message: "The user is not defined!",
        });
      }

      await User.findByIdAndDelete(id);
      resolve({
        status: "OK",
        message: "Delete user success",
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getAllUser = (limitUser, page) => {
  return new Promise(async (resolve, reject) => {
    try {
      const totalUser = await User.countDocuments();
      console.log("limitUser", limitUser);
      const allUser = await User.find()
        .limit(limitUser)
        .skip(page * limitUser);
      resolve({
        status: "OK",
        message: "Get all user success",
        data: allUser,
        totalUser: totalUser,
        currentPage: Number(page + 1),
        totalPage: Math.ceil(totalUser / Number(limitUser)),
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getDetailUser = (id) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        _id: id,
      });
      if (user === null) {
        resolve({
          status: "OK",
          message: "The user is not defined!",
        });
      }

      resolve({
        status: "OK",
        message: "Get Detail User success",
        data: user,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const getUserFavorites = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        _id: userId,
      }).populate("favorite");

      if (user === null) {
        resolve({
          status: "ERR",
          message: "The user is not defined!",
        });
      }

      const favoriteItems = user.favorite.map((item) => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        image: item.image,
        color: item.variants[0].color,
        size: item.variants[0].sizes[0].size,
      }));

      resolve({
        status: "OK",
        message: "Get user favorite success",
        data: favoriteItems,
      });
    } catch (e) {
      reject(e);
    }
  });
};

const handleFavoriteAction = (action, userId, productId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        _id: userId,
      });
      if (user === null) {
        resolve({
          status: "ERR",
          message: "The user is not defined!",
        });
      }

      if (action == "add") {
        const checkProduct = user.favorite.find(
          (item) => item.toString() === productId.toString()
        );
        console.log("checkProduct", checkProduct);

        if (checkProduct !== undefined) {
          console.log("Product is already in favorite list");
          return resolve({
            status: "ERR",
            message: "The product is already in favorite list!",
          });
        }

        user.favorite.push(productId);
        await user.save();

        resolve({
          status: "OK",
          message: "Add favorite success",
        });
      } else {
        const checkProduct = user.favorite.find(
          (item) => item.toString() === productId
        );

        if (checkProduct === undefined) {
          resolve({
            status: "ERR",
            message: "The product is not in favorite list!",
          });
        }

        user.favorite = user.favorite.filter(
          (item) => item.toString() !== productId
        );
        await user.save();

        resolve({
          status: "OK",
          message: "Remove favorite success",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const handleCartAction = (action, userId, productId, color, size, quantity) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        _id: userId,
      });
      if (user === null) {
        resolve({
          status: "ERR",
          message: "The user is not defined!",
        });
      }

      if (action == "add") {
        const checkProduct = user.cart.find(
          (item) =>
            item.product.toString() === productId.toString() &&
            item.color === color &&
            item.size === size
        );

        if (checkProduct !== undefined) {
          checkProduct.quantity += quantity;
          await user.save();

          return resolve({
            status: "OK",
            message: "Add cart success",
          });
        }

        user.cart.push({
          product: productId,
          color: color,
          size: size,
          quantity: quantity,
        });
        await user.save();

        resolve({
          status: "OK",
          message: "Add cart success",
        });
      } else if (action == "remove") {
        const checkProduct = user.cart.find(
          (item) => item.product.toString() === productId
        );

        if (checkProduct === undefined) {
          return resolve({
            status: "ERR",
            message: "The product is not in cart list!",
          });
        }

        user.cart = user.cart.filter(
          (item) => item.product.toString() !== productId
        );
        await user.save();

        resolve({
          status: "OK",
          message: "Remove cart success",
        });
      } else {
        const checkProduct = user.cart.find(
          (item) =>
            item.product.toString() === productId.toString() &&
            item.color === color &&
            item.size === size
        );

        if (checkProduct === undefined) {
          return resolve({
            status: "ERR",
            message: "The product is not in cart list!",
          });
        }

        checkProduct.quantity = quantity;
        await user.save();

        resolve({
          status: "OK",
          message: "Update cart success",
        });
      }
    } catch (e) {
      reject(e);
    }
  });
};

const getUserCart = (userId) => {
  return new Promise(async (resolve, reject) => {
    try {
      const user = await User.findOne({
        _id: userId,
      }).populate({
        path: "cart.product",
        select: "price name images",
      });

      if (user === null) {
        resolve({
          status: "ERR",
          message: "The user is not defined!",
        });
      }

      const cartItems = user.cart.map((item) => {
        return {
          product: item.product,
          color: item.color,
          size: item.size,
          quantity: item.quantity,
        };
      });

      resolve({
        status: "OK",
        message: "Get user cart success",
        data: cartItems,
      });
    } catch (e) {
      reject(e);
    }
  });
};

module.exports = {
  createUser,
  loginUser,
  updateUser,
  deleteUser,
  getAllUser,
  getDetailUser,
  getUserFavorites,
  handleFavoriteAction,
  getUserCart,
  handleCartAction,
};
