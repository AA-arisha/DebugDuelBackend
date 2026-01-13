import  { Request, Response , NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();

interface jwtPayload{
    userId: number;
    userName: string;
    userRole: 'ADMIN' | 'PARTICIPANT';
}

export interface AuthenticatedRequest extends Request {
    user?: jwtPayload;
}

export const authenticateUser = (requiredRole?: 'ADMIN' | 'PARTICIPANT') =>{
    return( req: AuthenticatedRequest , res: Response , next: NextFunction) =>{
        const authHeader = req.headers.authorization;
        if(!authHeader || !authHeader.startsWith('Bearer ')){
            return res.status(401).json({message: 'No token provided'});
        } 

        const token = authHeader.split(' ')[1];
        try{

            const secret = process.env.jwt_secret;
            if(!secret) {
                throw new Error('JWT SECRET not defined');
            }
            const decoded = jwt.verify(token , secret) as jwtPayload;
            req.user = decoded;
            if (requiredRole && decoded.userRole != requiredRole) {
                return res.status(401).json({message: "Access denied"})
            }
            next();
        } catch(error){
            return res.status(401).json({message : "Expired or invalid token"})
        }
    }
}