const User = require("../models/UserModel")
const bcrypt = require("bcrypt")
const generalAccessToken = require("./JwtService")

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
            console.log('comparePassword', comparePassword)
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

            const refresh_token = await generalAccessToken.generalRefreshToken({
                id: checkUser.id,
                isAdmin: checkUser.isAdmin
            })

            resolve({
                status: 'OK',
                message: 'Success',
                access_token,
                refresh_token
            })
            
            //if(checkUser)
            /*const createdUser = await User.create({
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
            }*/
        }catch(e)
        {
            reject(e);
        }
    })
}

module.exports = {
    createUser,
    loginUser
}