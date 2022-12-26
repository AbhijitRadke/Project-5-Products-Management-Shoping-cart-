const { Router } = require('express')
const router = Router()
const userController = require("../controllers/userController")
const productController = require("../controllers/productController")
const { authentication , authorization } = require("../middleware/auth")
const cartController = require("../controllers/cartController")
const orderControlar = require("../controllers/orderControlar")

// -------------------------User --------------

router.post("/register", userController.userCreate)

router.post("/login", userController.userLogin)

router.get("/user/:userId/profile", authentication, authorization, userController.userById)

router.put("/user/:userId/profile", authentication,authorization, userController.updateUser)
// -------------------------Products --------------

router.post("/products", productController.createProduct)

router.get("/products", productController.getAllProducts)

router.get("/products/:productId", productController.getProductsById)

router.put("/products/:productId", productController.updateProduct)

router.delete("/products/:productId", productController.deleteById)

//--------------cart---------------//

router.post("/users/:userId/cart", authentication, authorization, cartController.cartData)

router.put("/users/:userId/cart", authentication, authorization, cartController.updateCart)

router.get("/users/:userId/cart", authentication, middleware.authorization, cartController.getCart)

router.delete("/users/:userId/cart", middleware.authentication, middleware.authorization, cartController.deleteCart)

// -----------order---------//

router.post("/users/:userId/orders", authentication, authorization, orderControlar.createOrder)

router.put("/users/:userId/orders", authentication, authorization, orderControlar.UpdateOrder)


module.exports = router