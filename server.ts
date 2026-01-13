import express from "express";
import cors from "cors";
import dotenv from 'dotenv'
import problemRoutes from './src/routes/problemRoutes.js'
import submissionRoutes from './src/routes/submissionRoutes.js'
import runRoutes from './src/routes/runRoutes.js'
import AuthRoutes from './src/routes/AuthRoutes.js'
dotenv.config();
const app = express();
app.use(cors({
    origin: 'http://localhost:5173'
}));
app.use(express.json());


app.use('/problems', problemRoutes);
app.use('/submit', submissionRoutes);
app.use('/run' , runRoutes);
app.use('/' ,AuthRoutes )
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});