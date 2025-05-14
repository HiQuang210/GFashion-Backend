const OrderService = require('../services/OrderService')

const createOrder = async (req, res) => {
    try{
        const response = await OrderService.createOrder(req.body)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const updateOrder = async (req, res) => {
    try{
        const OrderId = req.params.id
        const data = req.body
        if(!OrderId)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'Order ID is required'
            })
        }
        const response = await OrderService.updateOrder(OrderId, data)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: "Error update Order",
            error: e.message
        })
    }
}

const deleteOrder = async (req, res) => {
    try{
        const OrderId = req.params.id
        if(!OrderId)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'Order ID is required'
            })
        }
        const response = await OrderService.deleteOrder(OrderId)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const getDetailOrder = async (req, res) => {
    try{
        const OrderId = req.params.id
        if(!OrderId)
        {
            return res.status(200).json({
                status: 'ERR',
                message: 'Order ID is required'
            })
        }
        const response = await OrderService.getDetailOrder(OrderId)
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

const getAllOrder = async (req, res) => {
    try{
        const response = await OrderService.getAllOrder()
        return res.status(200).json(response)
    }catch(e){
        return res.status(404).json({
            message: e
        })
    }
}

module.exports = {
    createOrder,
    updateOrder,
    deleteOrder,
    getDetailOrder,
    getAllOrder
}