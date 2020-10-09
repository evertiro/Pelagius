require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const https = require('https');

const token = process.env.BOT_TOKEN;

var staffUsers = ["222809044103069696"];
var staffGroups = [];
var approvedChannels = [];

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('a game');

  fs.access('./data', fs.constants.F_OK, (err) => {
    if (err) {
      fs.mkdir('./data', (err) => {
        if (err) {
          console.log("Error: could not create directory \'data\'");
        } else {
          console.log("Created directory \'data\'");
        }
      });
    }
  });

  fs.access('./data/channels.dat', fs.constants.F_OK, (err) => {
    if (err) {
      // File does not exist, this is OK
    } else {
      fs.readFile('./data/channels.dat', 'utf8', (err, data) => {
        if (err) {
          console.log("Could not read \'data/channels.dat\'");
        } else {
          data.split(',').forEach((channelID) => {
            approvedChannels.push(channelID);
          });
        }
      });
    }
  });
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
        if (isInGuild(message.guild, channelID)) {
          response += "<#" + channelID + ">\n";
        }
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
  updateChannelFile();
}

function removeApprovedChannel(channelID) {
  approvedChannels.splice(approvedChannels.indexOf(channelID.toString()),1);
  updateChannelFile();
}

function updateChannelFile() {
  fs.writeFile('./data/channels.dat', approvedChannels.toString(), (err) => {
    if (err) {
      console.log("Could not write approvedChannels to \'data/channels.dat\'")
    }
  });
}

function isInGuild(guild, channelID) {
  return guild.channels.cache.get(channelID) !== undefined;
}

// TODO: Add user group checking
function isStaff(userID) {
  if (staffUsers.includes(userID.toString())) {
    return true;
  }
  return false;
}

client.login(token);
