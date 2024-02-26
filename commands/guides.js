const { SlashCommandBuilder } = require('discord.js');
const { GuildManager } = require('../util/GuildManager.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guides')
		.setDescription('List available loadorder guides')
		.setDMPermission(false),
	async execute(interaction) {
		const guild = interaction.guild;
		const guildManager = new GuildManager(guild);
		await guildManager.init();

		const guides = guildManager.getGuides();
		const defaultGuide = guildManager.getDefaultGuide();
		const guideResponse = `Available guides: \n\`\`\`\n${guides.join(
			'\n'
		)}\n\`\`\`\nDefault guide: \`${defaultGuide}\``;
		await interaction.reply({ content: guideResponse, ephemeral: true });
	}
};
