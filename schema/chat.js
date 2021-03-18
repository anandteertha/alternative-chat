const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
	room:
		{
			type: String,
			unique: true,
			required: true
		},
	messages: [
		{
			time: Number,
			message: String,
			sender: String,
      receiver: String,
			k: String
		}
	],
	userUnread: {
		type: Boolean,
		default: false
	},
	header: [
		{
			val: Boolean,
			sender: String
		}
	]
});

const Chat = new mongoose.model('Chat', chatSchema);

module.exports = Chat;
