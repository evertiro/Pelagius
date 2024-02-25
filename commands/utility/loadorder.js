const { SlashCommandBuilder } = require('discord.js');
const { GuildManager } = require('../../util/GuildManager.js');
const { Logger } = require('../../util/Logger.js');
const { logChannelId } = require('../../config.json');
const https = require('https');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loadorder')
		.setDescription('Command to validate your loadorder')
		.setDMPermission(false)
		.addAttachmentOption((option) =>
			option.setName('file').setDescription('Your loadorder.txt file to compare').setRequired(true)
		)
		.addStringOption((option) =>
			option
				.setName('guide')
				.setDescription('Guide to validate loadorder against (use `/guides` to list guides)')
		),
	async execute(interaction) {
		const logChannel = await interaction.client.channels.fetch(logChannelId);
		const logger = new Logger(logChannel);
		const guild = interaction.guild;
		const guildManager = new GuildManager(guild);
		await guildManager.init();

		const guides = guildManager.getGuides();
		const defaultGuide = guildManager.getDefaultGuide();

		const guide = interaction.options.getString('guide') ?? defaultGuide;

		if (!guides.includes(guide)) {
			await interaction.reply({
				content: `The guide \`${guide}\` does not exist in this server`,
				ephemeral: true
			});
			return;
		}

		const masterLoadorder = await guildManager.getLoadorder(guide);
		if (masterLoadorder === null) {
			await interaction.reply({
				content: `The loadorder file for \`${guide}\` has not been set`,
				ephemeral: true
			});
			return;
		}

		const reasons = await guildManager.getReasons(guide);
		const skips = await guildManager.getSkips(guide);

		const userLoadorderUrl = interaction.options.getAttachment('file').url;
		const userLoadorder = (await readRemoteLoadorder(userLoadorderUrl, logger))
			.toLowerCase()
			.split(/\r?\n/);

		const result = compare(masterLoadorder, userLoadorder, reasons, skips);

		if (result === '') {
			await interaction.reply('Your loadorder has no issues!');
		} else {
			const buf = Buffer.from(result, 'utf8');
			const attachment = new AttachmentBuilder(buf, { name: 'differences.txt' });
			await interaction.reply({ content: "Here's what you need to fix", files: [attachment] });
		}
	}
};

async function readRemoteLoadorder(url, logger) {
	return new Promise((resolve, reject) => {
		https.get(url, (response) => {
			let content = '';
			response.on('data', (chunk) => {
				content += chunk;
			});

			response.on('end', () => {
				resolve(content);
			});

			response.on('error', (error) => {
				logger.logMessage(
					`There was an error reading remote URL \`${url}\`\n\`\`\`\n${error}\n\`\`\``
				);
				reject(error);
			});
		});
	});
}

function compare(master, user, reasons, skips) {
	let response = '';

	let temp = 'Your loadorder is missing: \n';
	master.forEach((line) => {
		if (line.trim() === '') {
			return;
		}

		if (!user.includes(line)) {
			if (!skips.includes(line)) {
				temp += line;

				if (reasons.hasOwnProperty(line)) {
					temp += reasons[line];
				}

				temp += '\n';
			}
		}
	});

	if (temp !== 'Your loadorder is missing: \n') {
		response = temp;
	}

	temp = '\nYour loadorder should not have: \n';

	user.forEach((line) => {
		if (line.trim() === '') {
			return;
		}

		if (!master.includes(line)) {
			if (!skips.includes(line)) {
				temp += line;

				if (reasons.hasOwnProperty(line)) {
					temp += reasons[line];
				}

				temp += '\n';
			}
		}
	});

	if (temp !== '\nYour loadorder should not have: \n') {
		response += temp;
	}

	return response;
}
