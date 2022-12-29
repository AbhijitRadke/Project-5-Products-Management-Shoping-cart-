const orderModel = require("../models/orderModel")
const validator = require("../utils/validator")
const userModel = require("../models/userModel")
const cartModel = require("../models/cartMode")

const { isValidBody, isValidObjectId, } = validator

const createOrder = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id" })
        let userdata = await userModel.findById(userId)
        if (!userdata) return res.status(404).send({ status: false, message: "user not found" })

        const data = req.body
        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Please provide valid request body" })

        let { cartId, cancellable } = data

        if (!isValidObjectId(cartId)) return res.status(400).send({ status: false, message: "Please provide valid cart Id" })
        let cartdata = await cartModel.findById(cartId)
        if (!cartdata) return res.status(404).send({ status: false, message: "cart not found" })
        if (cartdata.items.length === 0) return res.status(400).send({ status: false, message: "cart is empty, cannot create order" })

        if (typeof cancellable !== "boolean") return res.status(400).send({ status: false, message: "cansable shuld be true/false" })

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
            totalQuantity: totalQuantity,
            cancellable: Boolean(cancellable)
        }

        const saveData = await orderModel.create(orderData)
        await cartModel.findOneAndUpdate({ _id: cartId, userId: userId }, { items: [], totalItems: 0, totalPrice: 0 })
        res.status(201).send({ status: true, message: "Success", data: saveData });

    } catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }
}




const UpdateOrder = async function (req, res) {
    try {
        const userId = req.params.userId

        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "Please provide valid User Id" })
        let userdata = await userModel.findById(userId)
        if (!userdata) return res.status(404).send({ status: false, message: "user not found" })

        const data = req.body
        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Please provide valid request body" })

        let { orderId, status } = data
        if (!(["completed", "cancelled"].includes(status))) return res.status(400).send({ status: false, message: "Please provide completed or cancelled status" })

        if (!isValidObjectId(orderId)) return res.status(400).send({ status: false, message: "Please provide valid order Id" })
        let orderdata = await orderModel.findById(orderId)
        if (!orderdata) return res.status(404).send({ status: false, message: "order not found" })
        if (orderdata.status != "pending") return res.status(400).send({ status: true, message: `Status of this order is already ${orderdata.status}` })

        if (status == "cancelled") {
            if (orderdata.cancellable == "false") return res.status(400).send({ status: false, message: "This order is not cancellabled" })
        }

        const updatedData = await orderModel.findOneAndUpdate({ _id: orderId }, { status: status }, { new: true })

        res.status(200).send({ status: true, message: "Success", data: updatedData })

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })
    }

}


module.exports = { createOrder, UpdateOrder }