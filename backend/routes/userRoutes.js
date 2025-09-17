import e from "express";
import User from "../models/userModel";
import bcrypt from "bcryptjs";
import expressAsyncHandler from "express-async-handler";
import {generateToken} from "../utils";

const userRouter = e.Router();

userRouter.post(
    "/signin",
    expressAsyncHandler(async (req, res) => {
        const user = await User.findOne({
            if(user) {
                if (bcrypt.compareSync(req.body.password, user.password)) {
                    res.send({
                        _id: user._id,
                        name: user.name,
                        email: user.email,
                        isAdmin: user.isAdmin,
                        token: generateToken(user),
                    });
                    return;
                }
            },
        });

        res.status(401).send({message: "Invalid email or password"});
    })
);

export default userRouter;
