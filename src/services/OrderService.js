const Order = require("../models/OrderModel")

const createOrder = (newOrder) => {
    return new Promise(async (resolve, reject) => {
        const { date, delivery, address, payment, products } = newOrder
        try{
            
            const createdOrder = await Order.create({
                date, delivery, address, payment, products
            })

            if(createdOrder)
            {
                resolve({
                    status: 'OK',
                    message: 'Success',
                    data: createdOrder
                })
            }
            
        }catch(e)
        {
            reject(e);
        }
    })
}

const updateOrder = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try{
            const checkOrder = await Order.findOne({
                _id: id
            })
            if(checkOrder === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The Order is not defined!'
                })
            }
            const updatedOrder = await Order.findByIdAndUpdate(id, data, { new: true })
            resolve({
                status: 'OK',
                message: 'Success',
                data: updatedOrder
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const deleteOrder = (id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const checkOrder = await Order.findOne({
                _id: id
            })
            if(checkOrder === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The Order is not defined!'
                })
            }
            await Order.findByIdAndDelete(id)
            resolve({
                status: 'OK',
                message: 'Delete Order success',
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const getAllOrder = () => {
    return new Promise(async (resolve, reject) => {
        try{
            const allOrder = await Order.find()
            resolve({
                status: 'OK',
                message: 'Get all Order success',
                data: allOrder
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const getDetailOrder = (id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const Order = await Order.findOne({
                _id: id
            })
            if(Order === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The Order is not defined!'
                })
            }
            resolve({
                status: 'OK',
                message: 'Get Detail Order success',
                data: Order
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

module.exports = {
    createOrder,
    updateOrder,
    deleteOrder,
    getAllOrder,
    getDetailOrder
}