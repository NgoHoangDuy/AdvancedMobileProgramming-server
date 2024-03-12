/** @format */
const express = require('express');
const cors = require('cors');
//const authRouter = require('./src/routers/authRouter');
const connectDB = require('./src/configs/connectDb');
const errorMiddleHandle = require('./src/middlewares/errorMiddleware');
const app = express();
require('dotenv').config();
const authRouter = require('./src/routers/authRouter');
app.use(cors());
app.use(express.json());

const PORT = 3001;

//app.use('/auth', authRouter);

connectDB();

app.use(errorMiddleHandle);
app.use('/auth', authRouter);

app.listen(PORT, (err) => {
	if (err) {
		console.log(err);
		return;
	}

	console.log(`Server starting at http://localhost:${PORT}`);
});