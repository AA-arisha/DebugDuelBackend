import {Router, Response , Request} from 'express'
import prisma from '../prismaClient';
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
dotenv.config();

export const loginController = async ( req: Request , res: Response)=>{
    const {username , password} = req.body;
    if(!username || !password) return res.status(401).json({message : "password and username required"});

    try{
        const user = await prisma.user.findUnique({where : {username }});
        if(!user) return res.status(401).json({message: "Invalid username"});

        const isMatch = await bcrypt.compare(password , user.password);
        if(!isMatch) return res.status(401).json({message: "Invalid password"});

        const token = jwt.sign(
            {userId : user.id.toString(), username : user.username, userRole: user.role.toUpperCase() as 'ADMIN' | 'PARTICIPANT',},
            process.env.jwt_secret as string,
            {expiresIn : '4h'}
         )

         return res.json({token , role: user.role});
    }catch(err){
        console.log(err);
        return res.status(500).json({message: "server error"})
    }
}















