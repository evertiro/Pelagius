require('dotenv').config();
const Discord = require('discord.js');
const client = new Discord.Client();
const fs = require('fs');
const https = require('https');

const token = process.env.BOT_TOKEN;
const logChannel = '765326262616719366';
const fileTypes = ['loadorder', 'skip', 'reasons', 'loot'];

var staffUsers = new Map();
var approvedChannels = new Map();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    client.user.setActivity('a game');

    client.channels.cache.get(logChannel).send('Bot starting...');
    setup();
});

// Add guild owner to staff list when bot joins a new server
client.on('guildCreate', (guild) => {
    client.channels.cache.get(logChannel).send('Bot joined a new guild: ' + guild);
    staffUsers.set(guild.id, [guild.ownerID]);
    createDirectory('./data/' + guild.id);
    saveStaff(guild);
});

client.on('message', async (message) => {
    // Disallow DMs to bot
    if (message.guild === null) {
        return;
    }

    if (!message.content.startsWith('!loadorder')) {
        return;
    }

    let args = message.content.split(' ');
    if (args.length === 1) {
        message.channel.send('TODO: Add help message');
        return;
    }
    args = args.slice(1, args.length);

    if (args[0] === 'channel') {
        if (!isStaff(message.guild, message.author.id)) {
            return;
        }
        if (args.length === 1) {
            message.channel.send('Subcommands of `!loadorder channel`:\n' +
                '`!loadorder channel add` - Adds this channel to list of approved channels\n' +
                '`!loadorder channel remove` - Removes this channel from list of approved channels\n' +
                '`!loadorder channel status` - Says if channel is currently approved or not\n' +
                '`!loadorder channel list` - Lists approved channels');
            return;
        }

        if (args[1] === 'add') {
            addApprovedChannel(message.guild, message.channel.id);
            message.channel.send('Added <#' + message.channel.id + '> to the list of approved channels.');
        } else if (args[1] === 'remove') {
            removeApprovedChannel(message.guild, message.channel.id);
            message.channel.send('Removed <#' + message.channel.id + '> from the list of approved channels.');
        } else if (args[1] === 'status') {
            message.channel.send('<#' + message.channel.id + '> is' + (isApprovedChannel(message.guild, message.channel.id) ? '' : ' not') + ' an approved channel');
        } else if (args[1] === 'list') {
            let response = 'List of approved channels:\n';
            // Loop through approvedChannels, adding each one that's in the same guild as the sent command to the output
            approvedChannels.forEach((channels, guild) => {
                if (guild === message.guild.id) {
                    channels.forEach((channelID) => {
                        response += '<#' + channelID + '>\n';
                    });
                }
            });
            message.channel.send(response);
        } else {
            message.channel.send('Subcommands of `!loadorder channel`:\n' +
                '`!loadorder channel add` - Adds this channel to list of approved channels\n' +
                '`!loadorder channel remove` - Removes this channel from list of approved channels\n' +
                '`!loadorder channel status` - Says if channel is currently approved or not\n' +
                '`!loadorder channel list` - Lists approved channels');
        }
    }

    if (args[0] === 'staff') {
        if (!isStaff(message.guild, message.author.id)) {
            return;
        }

        if (args.length === 1) {
            message.channel.send('Subcommands of `!loadorder staff`:\n' +
                '`!loadorder staff add <user>` - Sets the given user as staff for the server\n' +
                '`!loadorder staff remove <user>` - Removes staff from the given user for the server\n' +
                '`!loadorder staff list` - Lists the staff in the server');
            return;
        }

        if (args[1] === 'add') {
            if (message.mentions.members.array().length != 1) {
                message.channel.send('This command must ping (mention) exactly 1 user, found ' + message.mentions.members.array().length);
                return;
            }
            let user = message.mentions.members.first();
            addStaff(message.guild, user.id);
            message.channel.send('Added ' + user.user.username + ' to the staff list');
        } else if (args[1] === 'remove') {
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
        } else if (args[1] === 'list') {
            let response = 'List of staff members:\n';
            // Loop through staffUsers, adding each one that's in the same guild as the sent command to the output
            staffUsers.forEach((users, guild) => {
                if (guild === message.guild.id) {
                    // guilds are keys, users are values (in an array)
                    // get the proper guild, then loop through the users in the array
                    users.forEach((userID) => {
                        // Convert from developer ID to username and tag (i.e. Robotic#1111)
                        let userObj = client.users.cache.get(userID);
                        response += userObj.username + '#' + userObj.discriminator + ' (' + userID + ')\n';
                    });
                }
            });
            message.channel.send(response);
        } else {
            message.channel.send('Subcommands of `!loadorder staff`:\n' +
                '`!loadorder staff add <user>` - Sets the given user as staff for the server\n' +
                '`!loadorder staff remove <user>` - Removes staff from the given user for the server\n' +
                '`!loadorder staff list` - Lists the staff in the server');
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
                fileTypes.toString());
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
    if (!isApprovedChannel(message.guild, message.channel.id)) {
        return;
    }
});

function addApprovedChannel(guild, channelID) {
    let guildChannels = approvedChannels.get(guild.id);
    guildChannels.push(channelID);
    approvedChannels.set(guild.id, guildChannels);
    saveChannels(guild);
}

function removeApprovedChannel(guild, channelID) {
    let guildChannels = approvedChannels.get(guild.id);
    guildChannels.splice(guildChannels.indexOf(channelID), 1);
    approvedChannels.set(guild.id, guildChannels);
    saveChannels(guild);
}

function isApprovedChannel(guild, channelID) {
    let guildChannels = approvedChannels.get(guild.id);
    return guildChannels.includes(channelID);
}

function addStaff(guild, userID) {
    let guildStaff = staffUsers.get(guild.id);
    guildStaff.push(userID);
    staffUsers.set(guild.id, guildStaff);
    saveStaff(guild);
}

function removeStaff(guild, userID) {
    let guildStaff = staffUsers.get(guild.id);
    guildStaff.splice(guildStaff.indexOf(userID), 1);
    staffUsers.set(guild.id, guildStaff);
    saveStaff(guild);
}

function isStaff(guild, userID) {
    let guildStaff = staffUsers.get(guild.id);
    return guildStaff.includes(userID);
}

function isInGuild(guild, channelID) {
    return guild.channels.cache.get(channelID) !== undefined;
}

function isValidFile(fileType) {
    return fileTypes.includes(fileType);
}

function setup() {
    createDirectory('./data');
    client.guilds.cache.forEach((guild) => {
        createDirectory('./data/' + guild.id);
        loadChannels(guild);
        loadStaff(guild);
    });
}

function createDirectory(path) {
    // First try to access the directory
    fs.access(path, fs.constants.F_OK, (err) => {
        // Error means no directory
        if (err) {
            // Try to create directory
            fs.mkdirSync(path);
        }
    });
}

function loadChannels(guild) {
    // Try to access the channels file for the guild
    fs.access('./data/' + guild.id + '/channels.dat', fs.constants.F_OK, (err) => {
        // If it errors, there's no file, set an empty one
        if (err) {
            approvedChannels.set(guild.id, []);
            saveChannels(guild);
            return;
        }
        // Now try to read the file
        fs.readFile('./data/' + guild.id + '/channels.dat', 'utf8', (err, data) => {
            if (err) {
                client.channels.cache.get(logChannel).send('Error: could not read `./data/' + guild.id + '/channels.dat`: \n' + err);
                console.log('Error: could not read \'./data/' + guild.id + '/channels.dat\'');
            } else {
                // Split file by comma, create a new list and add to Map
                let guildChannels = [];
                data.split(',').forEach((channelID) => {
                    guildChannels.push(channelID);
                });
                approvedChannels.set(guild.id, guildChannels);
                client.channels.cache.get(logChannel).send('Loaded approved channels from guild `' + guild.id + '` to memory');
            }
        });
    });
}

function loadStaff(guild) {
    // Try to access the staff file for the guild
    fs.access('./data/' + guild.id + '/staff.dat', fs.constants.F_OK, (err) => {
        // If it errors there's no file and we need to populate with the server owner and save it
        if (err) {
            staffUsers.set(guild.id, [guild.ownerID]);
            saveStaff(guild);
        } else {
            // Now try to read the file
            fs.readFile('./data/' + guild.id + '/staff.dat', 'utf8', (err, data) => {
                if (err) {
                    client.channels.cache.get(logChannel).send('Error: could not read `./data/' + guild.id + '/staff.dat`: \n' + err);
                    console.log('Error: could not read \'./data/' + guild.id + '/staff.dat\'');
                } else {
                    // Split file by comma, create a new list and add to Map
                    let guildStaff = [];
                    data.split(',').forEach((userID) => {
                        guildStaff.push(userID);
                    });
                    staffUsers.set(guild.id, guildStaff);
                    client.channels.cache.get(logChannel).send('Loaded staff members from guild `' + guild.id + '` to memory');
                }
            });
        }
    });
}

function saveChannels(guild) {
    // Get the array value connected to the guild id key
    // Turn it to a string, write it to file
    fs.writeFile('./data/' + guild.id + '/channels.dat', Array.from(approvedChannels.get(guild.id)).toString(), (err) => {
        if (err) {
            client.channels.cache.get(logChannel).send('Error: could not write approvedChannels to `./data/' + guild.id + '/channels.dat`\n' + err);
            console.log('Error: could not write approvedChannels to \'./data/' + guild.id + 'channels.dat\'\n' + err);
        } else {
            client.channels.cache.get(logChannel).send('Wrote approvedChannels to `./data/' + guild.id + '/channels.dat`');
        }
    });
}

function saveStaff(guild) {
    // Get the array value connected to the guild id key
    // Turn it to a string, write it to file
    fs.writeFile('./data/' + guild.id + '/staff.dat', Array.from(staffUsers.get(guild.id)).toString(), (err) => {
        if (err) {
            client.channels.cache.get(logChannel).send('Error: could not write staffUsers to `./data/' + guild.id + '/staff.dat`\n' + err);
            console.log('Error: could not write staffUsers to \'./data/' + guild.id + 'staff.dat\'\n' + err);
        } else {
            client.channels.cache.get(logChannel).send('Wrote staffUsers to `./data/' + guild.id + '/staff.dat`');
        }
    });
}

client.login(token);
