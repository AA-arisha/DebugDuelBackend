import express from 'express';
import { runCode } from '../controllers/runController';
const router = express.Router();

router.post('/', runCode);

export default router;
