const User = require("../models/UserModel")
const bcrypt = require("bcrypt")
const { generalAccessToken, generalRefreshToken } = require("./JwtService")

const createUser = (newUser) => {
    return new Promise(async (resolve, reject) => {
        const { name, email, password, confirmPassword, phone } = newUser
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
                name, 
                email, 
                password: hash, 
                phone
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

const loginUser = (userLogin) => {
    return new Promise(async (resolve, reject) => {
        const { name, email, password, confirmPassword, phone } = userLogin
        try{
            const checkUser = await User.findOne({
                email: email
            })
            if(checkUser === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The user is not defined!'
                })
            }
            const comparePassword = bcrypt.compareSync(password, checkUser.password)
            console.log('compare', comparePassword)

            if (!comparePassword)
            {
                resolve({
                    status: 'OK',
                    message: 'The password is incorrect!'
                })
            }            

            const access_token = await generalAccessToken({
                id: checkUser.id,
                isAdmin: checkUser.isAdmin
            })

            const refresh_token = await generalRefreshToken({
                id: checkUser.id,
                isAdmin: checkUser.isAdmin
            })

            resolve({
                status: 'OK',
                message: 'Success',
                access_token,
                refresh_token
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

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

const getAllUser = () => {
    return new Promise(async (resolve, reject) => {
        try{
            const allUser = await User.find()
            resolve({
                status: 'OK',
                message: 'Get all user success',
                data: allUser
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