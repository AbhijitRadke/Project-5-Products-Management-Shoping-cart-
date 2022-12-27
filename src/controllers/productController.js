const productModel = require("../models/productModel")
const validator = require("../utils/validator")
const config = require("../utils/awsConfig")

const { isValidName, isValidBody, isvalidPrice, isEmpty, isvalidSize, isValidObjectId, isVaildfile } = validator

const createProduct = async function (req, res) {
    try {
        const data = req.body
        let files = req.files;

        if (!isValidBody(data)) return res.status(400).send({ status: false, message: "Insert Data : BAD REQUEST" });

        const { title, description, price, currencyId, currencyFormat, style, availableSizes, installments } = data

        if (!title) return res.status(400).send({ status: false, message: "title is required" })
        if (!isEmpty(title)) return res.status(400).send({ status: false, message: "title should be in string format" });
        const findtitle = await productModel.findOne({ title, isDeleted: false })
        if (findtitle) return res.status(409).send({ status: false, message: "Please enter unique title" })

        if (!description) return res.status(400).send({ status: false, message: "description is required" })
        if (!isEmpty(description)) return res.status(400).send({ status: false, message: "description should be in string format" });

        if (!price) return res.status(400).send({ status: false, message: "price is required" })
        if (!isvalidPrice(price)) return res.status(400).send({ status: false, message: "Please enter valid price" });

        if (!currencyId) return res.status(400).send({ status: false, message: "currencyId is required" })
        if (currencyId !== 'INR') return res.status(400).send({ status: false, message: "Please enter price in INR" });

        if (!currencyFormat) return res.status(400).send({ status: false, message: "currencyFormat is required" })
        if (currencyFormat !== "₹") return res.status(400).send({ status: false, message: "Please currencyFormat ₹ " });

        if (style) {
            if (!isEmpty(style)) return res.status(400).send({ status: false, message: "Please enter valid style" });
        }

        if (installments) {
            if (! typeof data.installments == Number) {
                return res.status(400).send({ status: false, message: "Installments should in correct format" })
            }
        }

        if (availableSizes) {
            let sizeArr = availableSizes.toUpperCase().split(",")
            for (let i = 0; i < sizeArr.length; i++) {
                if (!isvalidSize(sizeArr[i])) return res.status(400).send({ status: false, message: "Size is not Valid" })
            }
            data.availableSizes = sizeArr;
        }

        console.log(files[0].originalname)
        if (files.length === 0) return res.status(400).send({ status: false, message: "Product Image is mandatory" })
        if (!isVaildfile(files[0].originalname)) return res.status(400).send({ status: false, message: "product image file is not valid" })
        const productImage = await config.uploadFile(files[0]);
        data.productImage = productImage

        const productData1 = await productModel.create(data)
        return res.status(201).send({ status: true, message: "Success", data: productData1 });

    } catch (error) {
        return res.status(500).send({ status: false, message: error.message })
    }
}


const getAllProducts = async function (req, res) {
    try {
        const filterQuery = {
            isDeleted: false
        }

        const queryParams = req.query;
        let { size, name, priceGreaterThan, priceLessThan, priceSort } = queryParams;

        //validation starts.
        if (size) {
            size = size.toUpperCase()
            if (!isvalidSize(size)) return res.status(400).send({ status: false, message: "Size is not valid" })
            filterQuery.availableSizes = size
        }

        //using $regex to match the subString of the names of products & "i" for case insensitive.
        if (name) {
            filterQuery.title = {
                $regex: name,
                $options: 'i'
            }
        }
        if (priceGreaterThan || priceLessThan) {
            filterQuery.price = {}

            if (priceLessThan) {
                if (!isvalidPrice(priceLessThan)) return res.status(400).send({ status: false, message: "Please enter valid price" });
                filterQuery.price['$lte'] = Number(priceLessThan)
            }

            if (priceGreaterThan) {
                if (!isvalidPrice(priceGreaterThan)) return res.status(404).send({ status: false, message: "Please enter valid price" });
                filterQuery.price['$gte'] = Number(priceGreaterThan)

            }
        }

        //sorting the products acc. to prices => 1 for ascending & -1 for descending.
        if (priceSort) {
            // priceSort = Number(priceSort)
            if (!((priceSort == 1) || (priceSort == -1))) {
                return res.status(400).send({ status: false, message: `priceSort should be 1 or -1 ` })
            }
        }
        console.log(filterQuery)

        const products = await productModel.find(filterQuery).sort({ price: priceSort })
        if (products.length === 0) return res.status(404).send({ status: false, message: 'No Product found' })

        res.status(200).send({ status: true, message: "Success", data: products })

    } catch (error) {
        return res.status(500).send({ status: false, error: error.message });
    }
}


//!..............................................................................
//fetch products by Id.
const getProductsById = async function (req, res) {
    try {
        const productId = req.params.productId

        //validation starts.
        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: `${productId} is not a valid product id` })

        //validation ends.

        const product = await productModel.findOne({ _id: productId, isDeleted: false });

        if (!product) return res.status(404).send({ status: false, message: `product does not exists` })


        res.status(200).send({ status: true, message: 'Success', data: product })
    } catch (err) {
        res.status(500).send({ status: false, message: "Error is : " + err })
    }
}

//---------update----------------------------------//

const updateProduct = async function (req, res) {
    try {
        let productId = req.params.productId
        let data = req.body
        let files = req.files
        console.log(files)

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "ProductId is not valid" })

        const product = await productModel.findById({ _id: productId })
        if (!product) return res.status(404).send({ status: false, message: "Product not found" })

        if (product.isDeleted === true) return res.status(404).send({ status: false, message: "Product is already deleted" })

        if (!isValidBody(data) && typeof(files) == 'undefined') return res.status(400).send({ status: "false", message: "Please enter fields to update" })

        const { title, description, price, style, availableSizes, installments } = data

        if (title) {
            if (!isEmpty(title)) return res.status(400).send({ status: false, message: "Title is not valid" })
            if (!isValidName(title.trim())) return res.status(400).send({ status: false, message: "title should be in string format" });
            const findTitle = await productModel.findOne({ title: title })
            if (findTitle) return res.status(409).send({ status: false, message: "This title is already exist" })
        }

        if (description) {
            if (!isEmpty(description)) return res.status(400).send({ status: false, message: "description should be in string format" });
        }

        if (price) {
            if (!isvalidPrice(price)) return res.status(400).send({ status: false, message: "Price is not present in correct format" })
        }

        if (files.length !== 0) {
            if (!isVaildfile(files[0].originalname)) return res.status(400).send({ status: false, message: "product image file is not valid" })
            const productImage = await config.uploadFile(files[0]);
            data.productImage = productImage

        }
        if (style) {
            if (!isEmpty(style)) return res.status(400).send({ status: false, message: "Style is not valid" })
        }

        if (availableSizes) {

            let sizeArr = availableSizes.toUpperCase().split(",")
            for (let i = 0; i < sizeArr.length; i++) {
                if (!isvalidSize(sizeArr[i])) return res.status(400).send({ status: false, message: `${sizeArr[i]} size is invalid` })
            }
            data.availableSizes = sizeArr;
        }

        if (installments) {
            if (! typeof data.installments == Number) return res.status(400).send({ status: false, message: "Installments should in correct format" })
        }

        const updatedProduct = await productModel.findOneAndUpdate({ _id: productId }, data, { new: true })

        res.status(200).send({ status: true, message: "Success", data: updatedProduct })

    } catch (error) {
        res.status(500).send({ status: false , message: error.message })
    }
}

//----------------------delete-----------------///\

const deleteById = async function (req, res) {
    try {
        const productId = req.params.productId

        if (!isValidObjectId(productId)) return res.status(400).send({ status: false, message: "Invalid Productid" })

        const productData = await productModel.findById(productId)
        if (!productData) return res.status(404).send({ status: false , message: "No details exists with this productId" })

        if (productData.isDeleted) return res.status(404).send({ status: false , message: "Product not found (already deleted)" })

        let deleteProduct = await productModel.findOneAndUpdate({ _id: productId }, { $set: { isDeleted: true, deletedAt: new Date() } }, { new: true })

        res.status(200).send({ status: true, message: "Success", productId: deleteProduct })

    } catch (err) {
        res.status(500).send({ status: false , message: err.message })
    }

}

module.exports = { getProductsById, getAllProducts, createProduct, deleteById, updateProduct }