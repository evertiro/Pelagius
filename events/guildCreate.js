const { Events } = require('discord.js');
const { Logger } = require('../util/Logger.js');
const { FileManager } = require('../util/FileManager.js');
const { logChannelId } = require('../config.json');

module.exports = {
	name: Events.GuildCreate,
	async execute(guild) {
		const guildDetails = await getGuildDetails(guild);

		const logChannel = await client.channels.fetch(logChannelId);
		const logger = new Logger(logChannel);
		logger.logMessage(guild.client, `Bot joined a new guild: \n\`\`\`${guildDetails}\`\`\``);

		const fileManager = new FileManager();
		fileManager.createGuildFiles(guild);
	}
};

async function getGuildDetails(guild) {
	const name = guild.name;
	const id = guild.id;
	const ownerId = guild.ownerId;
	const ownerName = (await guild.client.users.fetch(ownerId)).displayName;

	return `Guild Name: ${name}\nGuild ID: ${id}\nGuild Owner Name: ${ownerName}\nGuild Owner ID: ${ownerId}`;
}
