import express from 'express';
import { submitCode } from '../controllers/submissionController.js';

const router = express.Router();

router.post('/', submitCode);

export default router;
