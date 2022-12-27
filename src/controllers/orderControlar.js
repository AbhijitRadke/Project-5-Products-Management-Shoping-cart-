const orderModel = require("../models/orderModel")
const validator = require("../utils/validator")
const userModel = require("../models/userModel")
const cartModel = require("../models/cartMode")



const { isValidBody, isValidObjectId, isvalidQuantity } = validator


const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const data = req.body
        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Please provide valid request body" })

        let { cartId } = data

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id" })
        let userdata = await userModel.findById(userId)
        if (!userdata) return res.status(404).send({ status: false, msg: "user not found" })

        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please provide valid cart Id" })
        let cartdata = await cartModel.findById(cartId)
        if (!cartdata) return res.status(404).send({ status: false, msg: "cart not found" })

        let totalQuantity = 0
        const itemsArr = cartdata.items
        for (let i = 0; i < itemsArr.length; i++) {
            totalQuantity += itemsArr[i].quantity

        }

        const orderData = {
            userId: userId,
            items: cartdata.items,
            totalPrice: cartdata.totalPrice,
            totalItems: cartdata.totalItems,
            totalQuantity: totalQuantity

        }
        const saveData = await orderModel.create(orderData)
        await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, { items: [], totalItems: 0, totalPrice: 0 })
        return res.status(201).send({ status: true, message: "Success", data: saveData });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}








const UpdateOrder = async function (req, res) {
    try {
        const userId = req.params.userId
        const data = req.body
        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Please provide valid request body" })

        let { orderId, status } = data
        if (!(["completed", "cancelled"].includes(status))) return res.status(400).send({ status: false, message: "only provide pending, completed, cancelled data " })
        
        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id" })
        let userdata = await userModel.findById(userId)
        if (!userdata) return res.status(404).send({ status: false, msg: "user not found" })

        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "Please provide valid order Id" })
        let orderdata = await orderModel.findById(orderId)
        if (!orderdata) return res.status(404).send({ status: false, msg: "orderId not found" })
        if (status == "cancelled") {
            if (orderdata.cancellable == "false") return res.status(400).send({ status: false, message: "this order cannot be cancellabled" })
        }


        let totalQuantity = 0
        const itemsArr = orderdata.items
        for (let i = 0; i < itemsArr.length; i++) {
            totalQuantity += itemsArr[i].quantity

        }


        const UpdatedOrder = {
            userId: userId,
            items: orderdata.items,
            totalPrice: orderdata.totalPrice,
            totalItems: orderdata.totalItems,
            totalQuantity: totalQuantity,
            status: status
        }

        const updatedData = await orderModel.findByIdAndUpdate(orderId, {
            $set: { ...UpdatedOrder }
        }, { new: true })
        if (!updatedData) return res.status(400).send({ status: false, message: "invalid order Id" })
        return res.status(200).send({ status: true, data: updatedData })

    }
    catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }

}


module.exports = { createOrder, UpdateOrder }