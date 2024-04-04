/** @format */

const UserModel = require('../models/userModel');
const bcryp = require('bcrypt');
const asyncHandle = require('express-async-handler');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
	host: 'smtp.gmail.com',
	port: 465,
	secure: true,
	auth: {
		user: process.env.USERNAME_EMAIL,
		pass: process.env.PASSWORD_EMAIL,
	},
});

const getJsonWebToken = async (email, id) => {
	const payload = {
		email,
		id,
	};
	const token = jwt.sign(payload, process.env.SECRET_KEY, {
		expiresIn: '7d',
	});

	return token;
};

const register = asyncHandle(async (req, res) => {
	const { email, username, password } = req.body;
	console.log(req.body);

	const existingUser = await UserModel.findOne({ email });

	if (existingUser) {
		res.status(400);
		throw new Error('User has already exist!!!');
	}

	const salt = await bcryp.genSalt(10);
	const hashedPassword = await bcryp.hash(password, salt);

	const newUser = new UserModel({
		email,
		name: username ?? '',
		password: hashedPassword,
	});
	await newUser.save();

	res.status(200).json({
		message: 'Register new user successfully',
		data: {
			email: newUser.email,
			name: newUser.name,
			id: newUser.id,
			accesstoken: await getJsonWebToken(email, newUser.id),
		},
	});   
    
});

const login = asyncHandle(async (req, res) => {
	const { email, password } = req.body;

	const existingUser = await UserModel.findOne({ email });

	if (!existingUser) {
		res.status(403);
		throw new Error('User not found!!!');
	}

	const isMatchPassword = await bcryp.compare(password, existingUser.password);

	if (!isMatchPassword) {
		res.status(401);
		throw new Error('Email or Password is not correct!');
	}

	res.status(200).json({
		message: 'Login successfully',
		data: {
			id: existingUser.id,
			email: existingUser.email,
			accesstoken: await getJsonWebToken(email, existingUser.id),
			fcmTokens: existingUser.fcmTokens ?? [],
			photo: existingUser.photoUrl ?? '',
			name: existingUser.name ?? '',
		},
	});
});

const handleSendMail = async (val) => {
	try {
		await transporter.sendMail(val);

		return 'OK';
	} catch (error) {
		return error;
	}
};

const verification = asyncHandle(async (req, res) => {
	const { email } = req.body;

	const verificationCode = Math.round(1000 + Math.random() * 9000);

	try {
		const data = {
			from: `"Support EventHub Appplication" <${process.env.USERNAME_EMAIL}>`,
			to: email,
			subject: 'Verification email code',
			text: 'Your code to verification email',
			html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
			<div style="margin:50px auto;width:70%;padding:20px 0">
			  <div style="border-bottom:1px solid #eee">
				<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">EventHub</a>
			  </div>
			  <p style="font-size:1.1em">Hi,</p>
			  <p>Thank you for choosing EventHub. Use the following OTP to complete your Sign Up procedures. OTP is valid for 5 minutes</p>
			  <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${verificationCode}</h2>
			  <p style="font-size:0.9em;">Regards,<br />Your Brand</p>
			  <hr style="border:none;border-top:1px solid #eee" />
			  <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
				<p>Your Brand Inc</p>
				<p>1600 Amphitheatre Parkway</p>
				<p>California</p>
			  </div>
			</div>
			</div>`,
		};

		await handleSendMail(data);

		res.status(200).json({
			message: 'Send verification code successfully!!!',
			data: {
				code: verificationCode,
			},
		});
	} catch (error) {
		res.status(401);
		throw new Error('Can not send email');
	}
});


module.exports = {
	register,
	login,
	verification,
	//forgotPassword,
	//handleLoginWithGoogle,
};