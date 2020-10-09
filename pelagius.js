require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const https = require('https');

const token = process.env.BOT_TOKEN;

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('Eating cheese in the Shivering Isles');
});

client.login(token);
