const jwt = require('jsonwebtoken')
const { isValidObjectId } = require('mongoose')
const userModel = require('../models/userModel')



const authentication = async function (req, res, next) {
    try {
        let bearerHeader = req.headers.authorization;
        if (!bearerHeader) return res.status(400).send({ status: false, message: "Enter Token In BearerToken" });

        const bearer = bearerHeader.split(" ");
        const Token = bearer[1];


        if (!Token) return res.status(400).send({ status: false, message: "invalid token" });


        jwt.verify(Token, "NAFS", function (err, decodedToken) {
            if (err) return res.status(401).send({ status: false, message: "User is not Authenticated" });

            req.decodedToken = decodedToken;
            next();

        });
    } catch (err) {
        res.status(500).send({ status: false , message: err.message });
    }
};

//----------------Authorization------------------//

const authorization = async function (req, res, next) {
    try {
        let userLoggedIn = req.decodedToken;
        let userId = req.params.userId;


        if (!isValidObjectId(userId)) return res.status(400).send({ status: false, message: "userId is invalid" });
        const userData = await userModel.findById(userId)
        if (!userData) return res.status(404).send({ status: false, msg: "user not Found in Database" })
        if (userData.isDeleted) return res.status(400).send({ status: false, msg: "user is allrady deleated form Database" })


        if (userId !== userLoggedIn.userId) return res.status(403).send({ status: false, msg: "User is not authorized" });

        next();

    } catch (err) {
        res.status(500).send({ status: false, error: err.message });
    }
};

module.exports = { authentication, authorization };
