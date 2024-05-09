/** @format */

const asyncHandle = require('express-async-handler');
const EventModel = require('../models/eventModel');
const CategoryModel = require('../models/categoryModel');
const BillModel = require('../models/billModel');
const UserModel = require('../models/userModel');

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

const handleSendMail = async (val) => {
	try {
		await transporter.sendMail(val);

		return 'OK';
	} catch (error) {
		return error;
	}
};

const calcDistanceLocation = ({
	currentLat,
	curentLong,
	addressLat,
	addressLong,
}) => {
	const r = 6371;
	const dLat = toRoad(addressLat - currentLat);
	const dLon = toRoad(addressLong - curentLong);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.sin(dLon / 2) *
			Math.sin(dLon / 2) *
			Math.cos(toRoad(currentLat)) *
			Math.cos(toRoad(addressLat));
	return r * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

const toRoad = (val) => (val * Math.PI) / 180;

const addNewEvent = asyncHandle(async (req, res) => {
	const body = req.body;

	console.log(body);
	const data = { ...body };
	data.price = parseFloat(body.price);

	console.log(data);

	if (data) {
		const newEvent = new EventModel(data);

		await newEvent.save();

		res.status(200).json({
			message: 'Add new Event successfully!!!',
			data: newEvent,
		});
	} else {
		res.status(401);
		throw new Error('Event data not found!!!');
	}
});

const getEventById = asyncHandle(async (req, res) => {
	const { id } = req.query;

	const item = await EventModel.findById(id);

	res.status(200).json({
		message: 'Event detail',
		data: item ? item : [],
	});
});

const getEvents = asyncHandle(async (req, res) => {
	const { lat, long, distance, limit, date, categoryId, isUpcoming } = req.query;

	const filter = {}

		categoryId ? {
			categories: {$eq: categoryId}
		} : {}

	if (isUpcoming) {
		filter.startAt = {$gt: Date.now()}
	}

	const events = await EventModel.find(filter)
		.sort({ createdAt: -1 })
		.limit(limit ?? 0);

	if (lat && long && distance) {
		const items = [];
		if (events.length > 0) {
			events.forEach((event) => {
				const eventDistance = calcDistanceLocation({
					curentLong: long,
					currentLat: lat,
					addressLat: event.position.lat,
					addressLong: event.position.long,
				});

				if (eventDistance < distance) {
					items.push(event);
				}
			});
		}

		res.status(200).json({
			message: 'get events ok',
			data: date
				? items.filter((element) => element.date > new Date(date))
				: items,
		});
	} else {
		res.status(200).json({
			message: 'get events ok',
			data: date
				? events.filter((element) => element.date > new Date(date))
				: events,
		});
	}
});
const searchEvents = asyncHandle(async (req, res) => {
	const { title } = req.query;

	const events = await EventModel.find({});

	const items = events.filter((element) =>
		element.title.toLowerCase().includes(title.toLocaleLowerCase())
	);

	res.status(200).json({
		message: 'get events ok',
		data: items,
	});
});

const updateFollowers = asyncHandle(async (req, res) => {
	const body = req.body;
	const { id, followers } = body;

	await EventModel.findByIdAndUpdate(id, { followers, updatedAt: Date.now() });

	res.status(200).json({
		mess: 'Update followers successfully!',
		data: [],
	});
});

const getFollowers = asyncHandle(async (req, res) => {
	const { id } = req.query;

	const event = await EventModel.findById(id);

	if (event) {
		res.status(200).json({
			mess: 'Followers',
			data: event.followers ?? [],
		});
	} else {
		res.status(401);
		throw new Error('Event not found');
	}
});

const createCategory = asyncHandle(async (req, res) => {
	const data = req.body;

	const newCategory = new CategoryModel(data);

	newCategory.save();
	res.status(200).json({
		message: 'Add new category successfully!!!',
		data: newCategory,
	});
});

const updateCategory = asyncHandle(async(req, res) => {
	const data = req.body;
	const { id } = req.query;

	const item = await CategoryModel.findByIdAndUpdate(id, data);

	res.status(200).json({
		message: 'Update category successfully!!!',
		data: item,
	});
	
	
})

const getCategories = asyncHandle(async (req, res) => {
	const items = await CategoryModel.find({});

	res.status(200).json({
		message: 'get successfully!!!',
		data: items,
	});
});
const getCategoryDetail = asyncHandle(async (req, res) => {

	const {id} = req.query

	const item = await CategoryModel.findById(id);

	res.status(200).json({
		message: 'get successfully!!!',
		data: item,
	});
});

const updateEvent = asyncHandle(async (req, res) => {
	const data = req.body;
	const { id } = req.query;

	const item = await EventModel.findByIdAndUpdate(id, data);

	res.status(200).json({
		message: 'Update event successfully!!!',
		data: item,
	});
});
const getEventsByCategoyId = asyncHandle(async (req, res) => {
	const { id } = req.query;

	const items = await EventModel.find({ categories: { $all: id } });

	res.status(200).json({
		message: 'get Events by categories successfully!!!',
		data: items,
	});
});

const handleAddNewBillDetail = asyncHandle(async (req, res) => {
	const data = req.body;
	console.log(data);

	data.price = parseFloat(data.price);

	const bill = new BillModel(data);
	bill.save();

	res.status(200).json({
		message: 'Add new bill info successfully',
		data: bill,
	});
});




const handleUpdatePaymentSuccess = asyncHandle(async (req, res) => {
	const { billId } = req.query;
	console.log(req.query)
	await BillModel.findByIdAndUpdate(billId, {
		status: 'success',
	});
	const billInfor = await BillModel.findOne({_id: billId});
	console.log(billInfor);
	const aid = billInfor.authorId;
	const authorInfor = await UserModel.findOne({_id: aid});
	console.log(authorInfor);
	const eid = billInfor.eventId;
	console.log(eid);
	const eventInfor = await EventModel.findOne({_id: eid});
	console.log(eventInfor.title);
	const bid = billInfor.createdBy;
	const buyerInfor = await UserModel.findOne({_id: bid});
	console.log(buyerInfor);
	const data = {
		from: `"Support EventHub Appplication" <${process.env.USERNAME_EMAIL}>`,
		to: buyerInfor.email,
		subject: 'EventHub Ticket',
		text: 'Your EventHub Ticket',
		html: `<div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
		<div style="margin:50px auto;width:70%;padding:20px 0">
		  <div style="border-bottom:1px solid #eee">
			<a href="" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">EventHub</a>
		  </div>
		  <p style="font-size:1.1em"></p>Hi ${buyerInfor.name}! <br/>
		  Thank you for choosing EventHub. Your ticket infor and bill infor is below <br/>
		  Event name: ${eventInfor.title} <br/>
		  Price: ${eventInfor.price} <br/>
		  Bill ID: ${billId} <br/>
		  </p>
		  <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${billInfor.eventId}</h2>
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
		message: 'Update bill successfully',
		data: [],
	});
});

module.exports = {
	addNewEvent,
	getEvents,
	updateFollowers,
	getFollowers,
	createCategory,
	getCategories,
	updateCategory,
	getCategoryDetail,
	getEventById,
	searchEvents,
	updateEvent,
	getEventsByCategoyId,
	handleAddNewBillDetail,
	handleUpdatePaymentSuccess,
};