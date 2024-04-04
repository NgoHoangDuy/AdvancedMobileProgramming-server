/** @format */

const asyncHandle = require('express-async-handler');
const UserModel = require('../models/userModel');
const { query } = require('express');
const EventModel = require('../models/eventModel');

const getAllUsers = asyncHandle(async (req, res) => {
	const users = await UserModel.find({});

	const data = [];
	users.forEach((item) =>
		data.push({
			email: item.email ?? '',
			name: item.name ?? '',
			id: item.id,
		})
	);

	res.status(200).json({
		message: 'Get users successfully!!!',
		data,
	});
});

const getUserDetail = asyncHandle(async (req, res) => {
	const { uid } = req.query;

	if (uid) {
		const user = await UserModel.findById(uid);

		if (user) {
			const data = {
				id: user._id,
				createdAt: user.createdAt,
				email: user.email,
				photoUrl: user.photoUrl ?? '',
				name: user.name ?? '',
			};

			res.status(200).json({
				message: 'User infomation',
				data,
			});
		} else {
			res.status(401);
			throw new Error('User not found');
		}
	} else {
		res.status(401);
		throw new Error('Uid is missing!!!');
	}
});

const getEventsFollowed = asyncHandle(async (req, res) => {
	const { uid } = req.query;

	if (uid) {
		const events = await EventModel.find({ followers: { $all: uid } });

		const ids = [];

		events.forEach((event) => ids.push(event.id));

		res.status(200).json({
			message: 'fafa',
			data: ids,
		});
	} else {
		res.sendStatus(401);
		throw new Error('Missing uid');
	}
});

module.exports = { getAllUsers, getEventsFollowed, getUserDetail };