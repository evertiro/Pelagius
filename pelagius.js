require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const https = require('https');

const token = process.env.BOT_TOKEN;
const logChannel = '765326262616719366';

var staffUsers = new Map();
var staffGroups = [];
var approvedChannels = [];

client.on('ready', () => {
	console.log(`Logged in as ${client.user.tag}!`);
	client.user.setActivity('a game');

	client.channels.cache.get(logChannel).send('Bot starting...');
  // Try to create data directory if not present
  fs.access('./data', fs.constants.F_OK, (err) => {
    if (err) {
      fs.mkdir('./data', (err) => {
        if (err) {
					client.channels.cache.get(logChannel).send('Error: could not create directory `data`: \n' + err);
          console.log('Error: could not create directory \'data\'');
        } else {
					client.channels.cache.get(logChannel).send('Created directory `data`');
          console.log('Created directory \'data\'');
        }
      });
    }
  });

  // Load data from data/channels.dat into approvedChannels array
  // If file doesn't exist, that's fine
  fs.access('./data/channels.dat', fs.constants.F_OK, (err) => {
    if (!err) {
      fs.readFile('./data/channels.dat', 'utf8', (err, data) => {
        if (err) {
					client.channels.cache.get(logChannel).send('Error: could not read `data/channels.dat`: \n' + err);
          console.log('Error: could not read \'data/channels.dat\'');
        } else {
          data.split(',').forEach((channelID) => {
            approvedChannels.push(channelID);
          });
					client.channels.cache.get(logChannel).send('Loaded approved channels to memory');
        }
      });
    }
  });

  // Load data from data/users.dat into staffUsers
  // Also ensures each server owner starts as staff
  fs.access('./data/users.dat', fs.constants.F_OK, (err) => {
    // If file doesn't exist, populate staffUsers with server owners
    if (err) {
      client.guilds.cache.forEach((guild) => {
        staffUsers.set(guild.id, [guild.ownerID])
      });
      updateStaffFile();
      client.channels.cache.get(logChannel).send('Created a new staff file with server owners as staff');
    } else {
      fs.readFile('./data/users.dat', 'utf8', (err, data) => {
        if (err) {
					client.channels.cache.get(logChannel).send('Error: could not read `data/users.dat`: \n' + err);
          console.log('Error: could not read \'data/users.dat\'');
        } else {
          // Split IDs from file into a list
          let ids = data.split(',');
          let serverIDIndecies = [];
          // Populate serverIDIndecies with each index of the guilds in the list
          for (let i = 0; i < ids.length; i++) {
            if (client.guilds.cache.has(ids[i])) {
              serverIDIndecies.push(i);
            }
          }
          // Then loop through those indecies, slicing between each one and adding to map
          for (let i = 0; i < serverIDIndecies.length; i++) {
            let guildID = ids[serverIDIndecies[i]];
            var userIDs;
            // Check if at end of loop, otherwise would throw IndexOutOfBounds
            if (i + 1 != serverIDIndecies.length) {
              userIDs = ids.slice(serverIDIndecies[i]+1, serverIDIndecies[i+1]);
            } else {
              userIDs = ids.slice(serverIDIndecies[i]+1);
            }
            // Add list to map
            staffUsers.set(guildID, userIDs);
          }
					client.channels.cache.get(logChannel).send('Loaded staff list from file to memory');
        }
      });
    }
  })

});

// Add guild owner to staff list when bot joins a new server
client.on('guildCreate', (guild) => {
	client.channels.cache.get(logChannel).send('Bot joined a new guild: ' + guild);
	staffUsers.set(guild.id, [guild.ownerID]);
	updateStaffFile();
});

client.on('message', async (message) => {
	// Disallow DMs to bot
	if (message.guild === null) {
		return;
	}

  if (!message.content.startsWith('!loadorder')) {
    return;
  }

  // Staff only commands
  if (message.content.startsWith('!loadorder channel')) {
    if (!isStaff(message.guild, message.author.id)) {
      return;
    }
    if (message.content === '!loadorder channel') {
      message.channel.send('Subcommands of `!loadorder channel`:\n' +
                           '`!loadorder channel add` - Adds this channel to list of approved channels\n' +
                           '`!loadorder channel remove` - Removes this channel from list of approved channels\n' +
                           '`!loadorder channel status` - Says if channel is currently approved or not\n' +
                           '`!loadorder channel list` - Lists approved channels');
      return;
    }
    if (message.content === '!loadorder channel add') {
      addApprovedChannel(message.channel.id);
      message.channel.send('Added <#' + message.channel.id + '> to the list of approved channels.');
      return;
    }
    if (message.content === '!loadorder channel remove') {
      removeApprovedChannel(message.channel.id);
      message.channel.send('Removed <#' + message.channel.id + '> from the list of approved channels.');
      return;
    }
    if (message.content === '!loadorder channel status') {
      message.channel.send('<#' + message.channel.id + '> is' + (isApprovedChannel(message.channel.id) ? '' : ' not') + ' an approved channel');
      return;
    }
    if (message.content === '!loadorder channel list') {
      let response = 'List of approved channels:\n';
      // Loop through approvedChannels, adding each one that's in the same guild as the sent command to the output
      approvedChannels.forEach((channelID) => {
        if (isInGuild(message.guild, channelID)) {
          response += '<#' + channelID + '>\n';
        }
      });
      message.channel.send(response);
      return;
    }
  }

  if (message.content.startsWith('!loadorder staff')) {
    if (!isStaff(message.guild, message.author.id)) {
      return;
    }
    if (message.content === '!loadorder staff') {
      message.channel.send('Subcommands of `!loadorder staff`:\n' +
                           '`!loadorder staff add <user>` - Sets the given user as staff for the server\n' +
                           '`!loadorder staff remove <user>` - Removes staff from the given user for the server\n' +
                           '`!loadorder staff list` - Lists the staff in the server');
      return;
    }
    if (message.content.startsWith('!loadorder staff add')) {
      if (message.mentions.members.array().length != 1) {
        message.channel.send('This command must ping (mention) exactly 1 user, found ' + message.mentions.members.array().length);
        return;
      }
      let user = message.mentions.members.first();
      addStaff(message.guild, user.id);
      message.channel.send('Added ' + user.user.username + ' to the staff list');
    }
    if (message.content.startsWith('!loadorder staff remove')) {
      if (message.mentions.members.array().length != 1) {
        message.channel.send('This command must ping (mention) exactly 1 user, found ' + message.mentions.members.array().length);
        return;
      }
      let user = message.mentions.members.first();
      if (user.id === message.guild.ownerID) {
        message.channel.send('That user cannot be removed from staff, they are the server owner');
        return;
      }
      removeStaff(message.guild, user.id);
      message.channel.send('Removed ' + user.user.username + ' from the staff list');
    }
		if (message.content === '!loadorder staff list') {
			let response = 'List of staff members:\n';
      // Loop through staffUsers, adding each one that's in the same guild as the sent command to the output
      staffUsers.forEach((users, guild) => {
        if (guild === message.guild.id) {
					// guilds are keys, users are values (in an array)
					// get the proper guild, then loop through the users in the array
					users.forEach((userID) => {
						// Convert from developer ID to username and tag (i.e. Robotic#1111)
						let userObj = client.users.cache.get(userID);
						response += userObj.username + '#' + userObj.discriminator + '\n';
					});
        }
      });
      message.channel.send(response);
      return;
		}
  }

	if (message.content.startsWith('!loadorder file')) {
		if (!isStaff(message.guild, message.author.id)) {
      return;
    }
		if (message.content === '!loadorder file') {
			message.channel.send('Subcommands of `!loadorder file`:\n' +
													 '`!loadorder file [file] update`: Updates the specified file\n' +
												   '`!loadorder file [file] archive`: Archives the current specified file (rarely used)\n' +
												   '`!loadorder file [file] retrieve`: Retrieves and sends the specified file in a discord message attachment\n\n' +
												   'Possible files:\n' +
												   'loadorder\nskip\nreasons\nloot');
			return;
		}
		// Regex to match message
		let regex = '!loadorder file [a-z]\\w+ ';

		// Validate the [file] argument
		let fileType = message.content.split(' ')[2];
		if (!isValidFile(fileType)) {
			message.channel.send('Unknown file type: `' + fileType + '`. Known files types:\n' +
													 'loadorder\nskip\nreasons\nloot');
			return;
		}

		if (message.content.match(regex + 'update') !== null) {
			if (message.attachments.size != 1) {
				message.channel.send('Message must contain exactly 1 attachment');
				return;
			}
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
  approvedChannels.splice(approvedChannels.indexOf(channelID), 1);
  updateChannelFile();
}

function updateChannelFile() {
  fs.writeFile('./data/channels.dat', approvedChannels.toString(), (err) => {
    if (err) {
			client.channels.cache.get(logChannel).send('Error: could not write approvedChannels to \'data/channels.dat\'\n' + err);
      console.log('Error: could not write approvedChannels to \'data/channels.dat\'')
    } else {
			client.channels.cache.get(logChannel).send('Wrote approvedChannels to data/channels.dat');
		}
  });
}

function isInGuild(guild, channelID) {
  return guild.channels.cache.get(channelID) !== undefined;
}

function addStaff(guild, userID) {
  // Get the current list of staff users in the guild
  let guildStaff = staffUsers.get(guild.id);
  // Add the new user to that list
  guildStaff.push(userID);
  // Replace that list in the map staffUsers
  staffUsers.set(guild.id, guildStaff);
  updateStaffFile();
}

function removeStaff(guild, userID) {
  // Get the current list of staff users in the guild
  let guildStaff = staffUsers.get(guild.id);
  // Remove the user from that list
  guildStaff.splice(guildStaff.indexOf(userID), 1);
  // Replace that list in the map staffUsers
  staffUsers.set(guild.id, guildStaff);
  updateStaffFile();
}

function isStaff(guild, userID) {
  let guildStaff = staffUsers.get(guild.id);
  return guildStaff.includes(userID);
}

function updateStaffFile() {
  fs.writeFile('./data/users.dat', Array.from(staffUsers).toString(), (err) => {
    if (err) {
			client.channels.cache.get(logChannel).send('Error: could not write staffUsers to \'data/users.dat\'\n' + err);
      console.log('Error: could not write staffUsers to \'data/users.dat\'');
    } else {
			client.channels.cache.get(logChannel).send('Wrote staffUsers to data/users.dat');
		}
  })
}

function isValidFile(fileType) {
	return (fileType === "loadorder" || fileType === "skip" || fileType === "reasons" || fileType === "loot");
}

client.login(token);
