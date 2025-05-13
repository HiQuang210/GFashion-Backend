const jwt = require('jsonwebtoken')
const dotenv = require('dotenv');
dotenv.config()

//gpt
//Access_token là một mã ngắn hạn giúp người dùng không phải đăng nhập lại liên tục.
//Refresh_token dùng để kiểm soát phiên làm việc (session)

const generalAccessToken = async (payload) => {
    const access_token = jwt.sign({
        payload
    }, process.env.ACCESS_TOKEN, { expiresIn: '24h' })

    return access_token
}

const generalRefreshToken = async (payload) => {
    const refresh_token = jwt.sign({
        payload
    }, process.env.REFRESH_TOKEN, { expiresIn: '7d' })

    return refresh_token
}

const refreshTokenJwtService = (token) => {
    return new Promise((resolve, reject) => {
        try{
            console.log('token', token)
            jwt.verify(token, process.env.REFRESH_TOKEN, async (err, user) => {
                if (err)
                {
                    resolve({
                        status: 'ERROR',
                        message: 'The authentication'
                    })
                }
                    const { payload } = user
                    const access_token = await generalAccessToken({
                    id: payload?.id,
                    isAdmin: payload?.isAdmin
                })
                console.log('access_token', access_token)
                resolve({
                    status: 'OK',
                    message: 'Refresh token success',
                    access_token
                })
            })
        }catch(e)
        {
            console.log("reject", e.message)
            reject(e);
        }
    })
}


module.exports = {
    generalAccessToken,
    generalRefreshToken,
    refreshTokenJwtService
}