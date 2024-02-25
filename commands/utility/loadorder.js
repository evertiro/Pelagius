const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('loadorder')
		.setDescription('Main loadorder command')
		.setDMPermission(false)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('validate')
				.setDescription('Validates your loadorder')
				.addAttachmentOption((option) =>
					option
						.setName('file')
						.setDescription('Your loadorder.txt file to compare')
						.setRequired(true)
				)
				.addStringOption((option) =>
					option
						.setName('guide')
						.setDescription(
							'Guide to validate loadorder against (use /loadorder guides to list guides)'
						)
				)
		)
		.addSubcommand((subcommand) =>
			subcommand.setName('guides').setDescription('Lists guides to validate loadorder against')
		),
	async execute(interaction) {
		const options = interaction.options;
		const guildId = interaction.guildId;
		const subcommand = options.getSubcommand();

		if (subcommand === 'guides') {
			await interaction.reply({ content: getGuides(guildId), ephemeral: true });
		} else if (subcommand === 'validate') {
			await interaction.reply('validate');
		} else {
			await interaction.reply(`Unknown subcommand: ${subcommand}`);
		}
	}
};

function getGuides(guildId) {
	return guildId;
}
