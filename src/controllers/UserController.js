const UserService = require('../services/UserService')
const JwtService = require('../services/JwtService')

const createUser = async (req, res) => {
    try{
        const { name, email, password, confirmPassword, phone } = req.body
        var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        const isCheckEmail = reg.test(email)
        if (!name || !email || !password || !confirmPassword || !phone) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }else if (!isCheckEmail) 
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is email'
            })
        }else if (password !== confirmPassword)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'Confirm password must match the password'
            })
        }
        const response = await UserService.createUser(req.body)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const loginUser = async (req, res) => {
    try{
        const { name, email, password, confirmPassword, phone } = req.body
        var reg = /^\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/
        const isCheckEmail = reg.test(email)

        if (!name || !email || !password || !confirmPassword || !phone) {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is required'
            })
        }else if (!isCheckEmail) 
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'The input is email'
            })
        }else if (password !== confirmPassword)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'Confirm password must match the password'
            })
        }

        const response = await UserService.loginUser(req.body)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const updateUser = async (req, res) => {
    try{
        const userId = req.params.id
        const data = req.body
        //console.log('data', data)

        if(!userId)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'User ID is required'
            })
        }
        //console.log('id', userId)
        const response = await UserService.updateUser(userId, data)
        return res.status(200).json(response)
    }catch(e){
        console.log('error')
        return res.status(404).json({
            message: "Error occured",
            error: e.message
        })
    }
}

const deleteUser = async (req, res) => {
    try{
        const userId = req.params.id

        if(!userId)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'User ID is required'
            })
        }
        console.log('id', userId)
        const response = await UserService.deleteUser(userId)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const getAllUser = async (req, res) => {
    try{
        const { limitUser, page } = req.query
        const response = await UserService.getAllUser(Number(limitUser), Number(page))
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const getDetailUser = async (req, res) => {
    try{
        const userId = req.params.id

        if(!userId)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'User ID is required'
            })
        }
        console.log('id', userId)
        const response = await UserService.getDetailUser(userId)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const refreshToken = async (req, res) => {
    try{
        const token = req.headers.token.split(" ")[1]

        if(!token)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'The token is required'
            })
        }
        //console.log('id', userId)
        const response = await JwtService.refreshTokenJwtService(token)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e.message
        })
    }
}

module.exports = {
    createUser,
    loginUser,
    updateUser,
    deleteUser,
    getAllUser,
    getDetailUser,
    refreshToken
}