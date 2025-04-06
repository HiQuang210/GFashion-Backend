const User = require("../models/UserModel")
const bcrypt = require("bcrypt")
const { generalAccessToken, generalRefreshToken } = require("./JwtService")

const createUser = (newUser) => {
    return new Promise(async (resolve, reject) => {
        const { email, password, confirmPassword, phone, address } = newUser
        try{
            const checkUser = await User.findOne({
                email: email
            })
            if(checkUser !== null)
            {
                resolve({
                    status: 'OK',
                    message: 'The email is already exist!'
                })
            }
            const hash = bcrypt.hashSync(password, 10)
            const createdUser = await User.create({
                email, 
                password: hash, 
                phone,
                address
            })
            if(createdUser)
            {
                resolve({
                    status: 'OK',
                    message: 'Success',
                    data: createdUser
                })
            }
        }catch(e)
        {
            reject(e);
        }
    })
}

const loginUser = ({ email, password }) => {
    return new Promise(async (resolve, reject) => {
        try {
            const checkUser = await User.findOne({ email });
            if (!checkUser) {
                return resolve({
                    status: 'ERR',
                    message: 'User undefined'
                });
            }

            const comparePassword = bcrypt.compareSync(password, checkUser.password);
            if (!comparePassword) {
                return resolve({
                    status: 'ERR',
                    message: 'Incorrect password'
                });
            }

            const access_token = await generalAccessToken({
                id: checkUser._id,
                isAdmin: checkUser.isAdmin
            });

            const refresh_token = await generalRefreshToken({
                id: checkUser._id,
                isAdmin: checkUser.isAdmin
            });

            resolve({
                status: 'OK',
                message: 'Login successful',
                access_token,
                refresh_token,
                userInfo: {
                    email: checkUser.email,
                    phone: checkUser.phone,
                    address: checkUser.address || 'NA'
                }
            });
        } catch (e) {
            reject(e);
        }
    });
};


const updateUser = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try{
            const checkUser = await User.findOne({
                _id: id
            })
            console.log('checkUser', checkUser)
            if(checkUser === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The user is not defined!'
                })
            }

            //console.log('b4 update')
            const updateUser = await User.findByIdAndUpdate(id, data, { new: true })
            //console.log('updatedUser here', updateUser)

            resolve({
                status: 'OK',
                message: 'Success',
                data: updateUser
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const deleteUser = (id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const checkUser = await User.findOne({
                _id: id
            })
            console.log('checkUser', checkUser)
            if(checkUser === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The user is not defined!'
                })
            }

            await User.findByIdAndDelete(id)
            resolve({
                status: 'OK',
                message: 'Delete user success',
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const getAllUser = (limitUser, page) => {
    return new Promise(async (resolve, reject) => {
        try{
            const totalUser = await User.countDocuments()
            console.log('limitUser', limitUser)
            const allUser = await User.find().limit(limitUser).skip(page * limitUser)
            resolve({
                status: 'OK',
                message: 'Get all user success',
                data: allUser,
                totalUser: totalUser,
                currentPage: Number(page + 1),
                totalPage: Math.ceil(totalUser / Number(limitUser))
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const getDetailUser = (id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const user = await User.findOne({
                _id: id
            })
            if(user === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The user is not defined!'
                })
            }

            resolve({
                status: 'OK',
                message: 'Get Detail User success',
                data: user
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

module.exports = {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUser,
    getDetailUser
}