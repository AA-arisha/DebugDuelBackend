import {Router , Request , Response} from 'express';
import { loginController } from '../controllers/loginController';
import { AuthenticatedRequest, authenticateUser } from '../middlewares/authenticateUser';
const router = Router();

router.post('/login', loginController);
router.get('/dashboard' , authenticateUser('ADMIN') , (req : AuthenticatedRequest , res: Response) =>{
    res.json({
        message: `Hello Admin ${req.user?.username}, you have access!`,
    });
})

export default router;