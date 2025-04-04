const Product = require("../models/ProductModel")
const bcrypt = require("bcrypt")

const createProduct = (newProduct) => {
    return new Promise(async (resolve, reject) => {
        const { name, image, type, price, countInStock, rating, description } = newProduct

        try{
            const checkProduct = await Product.findOne({
                name: name
            })
            if(checkProduct !== null)
            {
                resolve({
                    status: 'OK',
                    message: 'The name of Product is already exist!'
                })
            }
            const createdProduct = await Product.create({
                name, image, type, price, countInStock, rating, description
            })
            if(createdProduct)
            {
                resolve({
                    status: 'OK',
                    message: 'Success',
                    data: createdProduct
                })
            }
        }catch(e)
        {
            reject(e);
        }
    })
}

const updateProduct = (id, data) => {
    return new Promise(async (resolve, reject) => {
        try{
            const checkProduct = await Product.findOne({
                _id: id
            })
            console.log('checkProduct', checkProduct)
            if(checkProduct === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The Product is not defined!'
                })
            }

            //console.log('b4 update')
            const updatedProduct = await Product.findByIdAndUpdate(id, data, { new: true })
            //console.log('updatedProduct here', updateProduct)

            resolve({
                status: 'OK',
                message: 'Success',
                data: updatedProduct
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const deleteProduct = (id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const checkProduct = await Product.findOne({
                _id: id
            })
            //console.log('checkProduct', checkProduct)
            if(checkProduct === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The Product is not defined!'
                })
            }

            await Product.findByIdAndDelete(id)
            resolve({
                status: 'OK',
                message: 'Delete Product success',
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const getAllProduct = (limitItem = 0, page = 0) => {
    return new Promise(async (resolve, reject) => {
        try{
            const totalProduct = await Product.countDocuments()
            console.log('limitItem', limitItem)
            const allProduct = await Product.find().limit(limitItem).skip(page * limitItem)
            resolve({
                status: 'OK',
                message: 'Get all Product success',
                data: allProduct,
                totalProd: totalProduct,
                currentPage: Number(page + 1),
                totalPage: Math.ceil(totalProduct / Number(limitItem))
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

const getDetailProduct = (id) => {
    return new Promise(async (resolve, reject) => {
        try{
            const product = await Product.findOne({
                _id: id
            })
            if(product === null)
            {
                resolve({
                    status: 'OK',
                    message: 'The Product is not defined!'
                })
            }

            resolve({
                status: 'OK',
                message: 'Get Detail Product success',
                data: product
            })
        }catch(e)
        {
            reject(e);
        }
    })
}

module.exports = {
    createProduct,
    updateProduct,
    deleteProduct,
    getAllProduct,
    getDetailProduct
}