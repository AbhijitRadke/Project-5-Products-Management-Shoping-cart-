const cartModel = require("../models/cartMode")
const validator = require("../utils/validator")
const userModel = require("../models/userModel")
const productModel = require("../models/productModel")


const { isValidBody, isValidObjectId, isvalidQuantity } = validator


const cartData = async function (req, res) {
    try {
        const userId = req.params.userId
        const data = req.body

        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Please provide valid request body" })

        let { productId, cartId, quantity } = data


        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id" })
        let userdata = await userModel.findById(userId)
        if (!userdata) return res.status(404).send({ status: false, msg: "user not found" })


        if (!productId) return res.status(400).send({ status: false, msg: "Product id is mandatory " })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, msg: "Please Enter productId" })
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, msg: "Product doesn't exists!" })


        if (!quantity) {
            quantity = 1
        } else {
            if (!isvalidQuantity(quantity)) return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." })
        }


        if (cartId) {
            if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, msg: "Please Enter valide cartId" })
            var existingcart = await cartModel.findOne({ _id: cartId, userId: userId })
            if (!existingcart) return res.status(403).send({ status: false, msg: "cart is not presrnt Or not belongs to user" })


            //updating price when products get added or removed.
            let price = existingcart.totalPrice + (quantity * product.price)
            let itemsArr = existingcart.items
            for (i in itemsArr) {
                if (itemsArr[i].productId.toString() === productId) {
                    itemsArr[i].quantity += quantity


                    // let updatedCart = { items: itemsArr, totalPrice: price, totalItems: itemsArr.length }
                    let responseData = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { items: itemsArr, totalPrice: price, totalItems: itemsArr.length } }, { new: true })

                    return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData })

                }

            }
            const newProduct = {
                productId: productId,
                quantity: quantity,
            }
            let addPrise = product.price * quantity
            const newProductData = await cartModel.findOneAndUpdate({ _id: cartId }, { $inc: { totalPrice: +addPrise, totalItems: +1 }, $push: { items: newProduct } }, { new: true })
            return res.status(200).send({ status: true, message: `Product added successfully`, data: newProductData })

        }

        if (!cartId) {
            const findcart = await cartModel.findOne({ userId: userId })
            if (findcart) return res.status(400).send({ status: false, msg: "cart is present for user please enter cart Id" })

            if (!existingcart) {
                const cartData = {
                    userId: userId,
                    items: [{ productId: productId, quantity: quantity, }],
                    totalPrice: product.price * quantity,
                    totalItems: 1
                }

                const createCart = await cartModel.create(cartData)
                return res.status(201).send({ status: true, message: `Cart created successfully`, data: createCart })
            }
        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}





const getCart = async function (req, res) {
    try {
        let userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid userId" });

        let findUser = await userModel.findById(userId)
        if (!findUser) return res.status(404).send({ status: false, message: "User not found" })

        let findCart = await cartModel.findOne({ userId: userId })
        if (!findCart) return res.status(404).send({ status: false, message: "cart is not found" })

        return res.status(200).send({ status: true, message: "Success", data: findCart })
    } catch (error) {
        return res.status(500).send({ status: false, msg: error.message })
    }
}
//-----------





const updateCart = async function (req, res) {
    try {
        const userId = req.params.userId
        const data = req.body

        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Please provide valid request body" })

        let { productId, cartId, removeProduct } = data


        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id" })
        let userdata = await userModel.findById(userId)
        if (!userdata) return res.status(404).send({ status: false, msg: "user not found" })


        if (!productId) return res.status(400).send({ status: false, msg: "Product id is mandatory " })
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, msg: "Please Enter productId" })
        let product = await productModel.findOne({ _id: productId, isDeleted: false })
        if (!product) return res.status(404).send({ status: false, msg: "Product doesn't exists!" })


        if (!removeProduct) {
            removeProduct = 1
        } else {
            if (!isvalidQuantity(removeProduct)) return res.status(400).send({ status: false, message: "Please provide valid quantity & it must be greater than zero." })
        }


        if (!cartId) return res.status(400).send({ status: false, msg: "cart id is mandatory " })


        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, msg: "Please Enter valide cartId" })
        var existingcart = await cartModel.findOne({ _id: cartId, userId: userId })
        if (!existingcart) return res.status(400).send({ status: false, msg: "cart is not presrnt Or not belongs to user" })
        if (existingcart.items.length == 0) return res.status(400).send({ status: false, msg: "cart is allrady Empty" })


        //updating price when products get added or removed.
        let price = existingcart.totalPrice - (removeProduct * product.price)
        if (price < 0) return res.status(400).send({ status: false, msg: `There are lessthan ${removeProduct} products` })
        if (price == 0) {
            let items = [];
            let totalPrice = 0
            let totalItems = 0
            const deleatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: items, totalPrice: totalPrice, totalItems: totalItems }, { new: true });
            return res.status(200).send({ status: true, message: 'csrt deleated Successfully', data: deleatedCart });

        }
        let itemsArr = existingcart.items
        for (let i = 0; i < itemsArr.length; i++) {
            if (itemsArr[i].productId.toString() === productId) {

                if (itemsArr[i].quantity < removeProduct) {
                    return res.status(400).send({ status: false, msg: `There are only ${itemsArr[i].quantity} products` })
                }

                itemsArr[i].quantity -= removeProduct

                if (itemsArr[i].quantity == 0) {
                    itemsArr.splice(i, 1)
                }

                let responseData = await cartModel.findOneAndUpdate({ _id: cartId }, { $set: { items: itemsArr, totalPrice: price, totalItems: itemsArr.length } }, { new: true })
                return res.status(200).send({ status: true, message: `Product added successfully`, data: responseData })

            }

        }

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}




const deleteCart = async function (req, res) {
    try {
        let userId = req.params.userId


        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, msg: "Invalid userId" });


        let findUser = await userModel.findById(userId)
        if (!findUser) return res.status(404).send({ status: false, message: "User not found" })

        const cheakCart = await cartModel.findOne({ userId: userId })
        if(!cheakCart)return res.status(400).send({ status: false, msg: "User Dont have a cart" });
        if(cheakCart.items.length == 0)return res.status(400).send({ status: false, msg: "cart is allrady Empty" });


        let items = [];
        let totalPrice = 0
        let totalItems = 0
        const deleatedCart = await cartModel.findOneAndUpdate({ userId: userId }, { items: items, totalPrice: totalPrice, totalItems: totalItems }, { new: true });
        return res.status(200).send({ status: true, message: 'csrt deleated Successfully', data: deleatedCart });
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}


module.exports = { cartData, deleteCart, getCart, updateCart }