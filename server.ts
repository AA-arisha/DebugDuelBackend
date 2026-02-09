import express from "express";
import cors from "cors";
import dotenv from 'dotenv'
import http from 'http';
import { initSocket } from './src/socket';
// import submissionRoutes from './src/routes/submissionRoutes.js'
import runRoutes from './src/routes/runRoutes'
import AuthRoutes from './src/routes/AuthRoutes'
import AdminRoutes from './src/routes/AdminRoutes'
dotenv.config();
const app = express();
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const oldJson = res.json;
  res.json = function (data) {
    return oldJson.call(this, JSON.parse(JSON.stringify(data, (key, value) =>
      typeof value === 'bigint' ? value.toString() : value
    )));
  };
  next();
});


// app.use('/problems', problemRoutes);
app.use('/run' , runRoutes);
app.use('/' ,AuthRoutes );
app.use('/admin' , AdminRoutes );

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

// Create HTTP server and init Socket.IO
const server = http.createServer(app);
initSocket(server);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running `);
});
