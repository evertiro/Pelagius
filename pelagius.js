require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const https = require('https');
const config = require('config');

const token = process.env.BOT_TOKEN;

var staffUsers = ["222809044103069696"];
var staffGroups = [];
var approvedChannels = [];

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('Eating cheese in the Shivering Isles');
});

client.on('message', async (message) => {
  if (!message.content.startsWith('!loadorder')) {
    return;
  }

  // Staff only commands
  if (message.content.startsWith('!loadorder channel')) {
    if (!isStaff(message.author.id)) {
      return;
    }
    if (message.content === '!loadorder channel') {
      message.channel.send("Subcommands of `!loadorder channel`:\n" +
                           "`!loadorder channel add` - Adds this channel to list of approved channels\n" +
                           "`!loadorder channel remove` - Removes this channel from list of approved channels\n" +
                           "`!loadorder channel status` - Says if channel is currently approved or not\n" +
                           "`!loadorder channel list` - Lists approved channels");
      return;
    }
    if (message.content === '!loadorder channel add') {
      addApprovedChannel(message.channel.id);
      message.channel.send("Added <#" + message.channel.id + "> to the list of approved channels.");
      return;
    }
    if (message.content === '!loadorder channel remove') {
      removeApprovedChannel(message.channel.id);
      message.channel.send("Removed <#" + message.channel.id + "> from the list of approved channels.");
      return;
    }
    if (message.content === '!loadorder channel status') {
      message.channel.send("<#" + message.channel.id + "> is" + (isApprovedChannel(message.channel.id) ? "" : " not") + " an approved channel");
      return;
    }
    if (message.content === '!loadorder channel list') {
      let response = "List of approved channels:\n";
      approvedChannels.forEach((channelID) => {
        response += "<#" + channelID + ">\n";
      });
      message.channel.send(response);
      return;
    }
  }

  // User commands, only allowed in approved channels
  if (!isApprovedChannel(message.channel.id)) {
    return;
  }
});

function isApprovedChannel(channelID) {
  return approvedChannels.includes(channelID.toString());
}

function addApprovedChannel(channelID) {
  approvedChannels.push(channelID.toString());
}

function removeApprovedChannel(channelID) {
  approvedChannels.splice(approvedChannels.indexOf(channelID.toString()),1);
}

// TODO: Add user group checking
function isStaff(userID) {
  if (staffUsers.includes(userID.toString())) {
    return true;
  }
  return false;
}



client.login(token);
