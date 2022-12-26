const { Router } = require('express')
const router = Router()
const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const middleware = require("../middleware/auth")
const cartController = require("../controllers/cartController")
const orderControlar = require("../controllers/orderControlar")

// -------------------------User --------------

router.post("/register", userController.userCreate)

router.post("/login", userController.userLogin)

router.get("/user/:userId/profile", userController.userById)

router.put("/user/:userId/profile", userController.updateUser)
// -------------------------Products --------------

router.post("/products", productController.createProduct)

router.get("/products", productController.getAllProducts)

router.get("/products/:productId", productController.getProductsById)

router.put("/products/:productId", productController.updateProduct)

router.delete("/products/:productId", productController.deleteById)

//--------------cart---------------//

router.post("/users/:userId/cart", cartController.cartData)

router.put("/users/:userId/cart", cartController.updateCart)

router.get("/users/:userId/cart", cartController.getCart)

router.delete("/users/:userId/cart", cartController.deleteCart)

// -----------order---------//

router.post("/users/:userId/orders", orderControlar.createOrder)
router.put("/users/:userId/orders",orderControlar.UpdateOrder)





module.exports = router