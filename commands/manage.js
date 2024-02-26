const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { GuildManager } = require('../util/GuildManager.js');
const { RemoteManager } = require('../util/RemoteManager.js');
const { Logger } = require('../util/Logger.js');
const { logChannelId } = require('../config.json');
const { AttachmentBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('manage')
		.setDescription('Manage your loadorder guides')
		.setDMPermission(false)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addSubcommandGroup((group) =>
			group
				.setName('channel')
				.setDescription('Manage approved channels')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('add')
						.setDescription('Adds a channel to the list of approved channels')
						.addChannelOption((option) =>
							option.setName('channel').setDescription('The channel to add').setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('remove')
						.setDescription('Removes a channel from the list of approved channels')
						.addChannelOption((option) =>
							option.setName('channel').setDescription('The channel to remove').setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('check')
						.setDescription('Checks if a channel is in the list of approved channels')
						.addChannelOption((option) =>
							option.setName('channel').setDescription('The channel to check').setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand.setName('list').setDescription('Lists the approved channels')
				)
		)
		.addSubcommandGroup((group) =>
			group
				.setName('guide')
				.setDescription('Manage list of guides')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('add')
						.setDescription('Adds a guide to the list of guides')
						.addStringOption((option) =>
							option.setName('guide').setDescription('The guide to add').setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('remove')
						.setDescription('Removes a guide from the list of guides')
						.addStringOption((option) =>
							option.setName('guide').setDescription('The guide to remove').setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('default')
						.setDescription('Sets a guide as the default')
						.addStringOption((option) =>
							option
								.setName('guide')
								.setDescription('The guide to set as default')
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('rename')
						.setDescription('Renames an existing guide')
						.addStringOption((option) =>
							option
								.setName('oldname')
								.setDescription('The current name of the guide')
								.setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName('newname')
								.setDescription('The new name of the guide')
								.setRequired(true)
						)
				)
				.addSubcommand((subcommand) =>
					subcommand.setName('list').setDescription('Lists the guides')
				)
		)
		.addSubcommandGroup((group) =>
			group
				.setName('file')
				.setDescription('Manages guide files')
				.addSubcommand((subcommand) =>
					subcommand
						.setName('upload')
						.setDescription('Uploads a new file')
						.addAttachmentOption((option) =>
							option.setName('file').setDescription('The file to upload').setRequired(true)
						)
						.addStringOption((option) =>
							option
								.setName('filetype')
								.setDescription('The type of file being uploaded')
								.setRequired(true)
								.setChoices(
									{ name: 'Loadorder', value: 'loadorder' },
									{ name: 'Reasons', value: 'reasons' },
									{ name: 'Skips', value: 'skips' }
								)
						)
						.addStringOption((option) =>
							option.setName('guide').setDescription('The guide to update the file for')
						)
				)
				.addSubcommand((subcommand) =>
					subcommand
						.setName('retrieve')
						.setDescription('Retrieves a file')
						.addStringOption((option) =>
							option
								.setName('filetype')
								.setDescription('The type of file being retrieved')
								.setRequired(true)
								.setChoices(
									{ name: 'Loadorder', value: 'loadorder' },
									{ name: 'Reasons', value: 'reasons' },
									{ name: 'Skips', value: 'skips' }
								)
						)
						.addStringOption((option) =>
							option.setName('guide').setDescription('The guide to retrieve the file for')
						)
				)
		),
	async execute(interaction) {
		const guild = interaction.guild;
		const guildManager = new GuildManager(guild);
		await guildManager.init();

		const guides = guildManager.getGuides();
		const defaultGuide = guildManager.getDefaultGuide();

		const subcommandGroup = interaction.options.getSubcommandGroup();
		const subcommand = interaction.options.getSubcommand();

		if (subcommandGroup === 'channel') {
			const channelOption = interaction.options.getChannel('channel');
			const channels = guildManager.getChannels();
			if (subcommand === 'add') {
				if (channels.includes(channelOption.id)) {
					await interaction.reply({
						content: `<#${channelOption.id}> is already an approved channel`,
						ephemeral: true
					});
					return;
				}

				await guildManager.addChannel(channelOption.id);
				await interaction.reply({
					content: `<#${channelOption.id}> has been added as an approved channel`,
					ephemeral: true
				});
			} else if (subcommand === 'remove') {
				if (!channels.includes(channelOption.id)) {
					await interaction.reply({
						content: `<#${channelOption.id}> is not approved channel`,
						ephemeral: true
					});
					return;
				}

				await guildManager.removeChannel(channelOption.id);
				await interaction.reply({
					content: `<#${channelOption.id}> has been removed from the approved channels`,
					ephemeral: true
				});
			} else if (subcommand === 'check') {
				const approved = channels.includes(channelOption.id);
				await interaction.reply({
					content: `<#${channelOption.id}> is${approved ? '' : ' not'} an approved channel`,
					ephemeral: true
				});
			} else if (subcommand === 'list') {
				const channelString = channels.map((channel) => `<#${channel}>`).join(', ');
				await interaction.reply({
					content: `Here are the approved channels: ${channelString}`,
					ephemeral: true
				});
			}
		} else if (subcommandGroup === 'guide') {
			const guideOption = interaction.options.getString('guide');
			if (subcommand === 'add') {
				if (guides.includes(guideOption)) {
					await interaction.reply({
						content: `\`${guideOption}\` is already in the list of guides`,
						ephemeral: true
					});
					return;
				}

				await guildManager.addGuide(guideOption);
				await interaction.reply({
					content: `\`${guideOption}\` has been added to the list of guides`,
					ephemeral: true
				});
			} else if (subcommand === 'remove') {
				if (!guides.includes(guideOption)) {
					await interaction.reply({
						content: `\`${guideOption}\` is not in the list of guides`,
						ephemeral: true
					});
					return;
				}

				if (defaultGuide === guideOption) {
					await interaction.reply({
						content: `\`${guideOption}\` is the default guide, it cannot be removed`,
						ephemeral: true
					});
					return;
				}

				await guildManager.removeGuide(guideOption);
				await interaction.reply({
					content: `\`${guideOption}\` has been removed from the list of guides`,
					ephemeral: true
				});
			} else if (subcommand === 'default') {
				if (!guides.includes(guideOption)) {
					await interaction.reply({
						content: `\`${guideOption}\` is not in the list of guides`,
						ephemeral: true
					});
					return;
				}

				if (defaultGuide === guideOption) {
					await interaction.reply({
						content: `\`${guideOption}\` is already the default guide`,
						ephemeral: true
					});
					return;
				}

				await guildManager.setDefaultGuide(guideOption);
				await interaction.reply({
					content: `\`${guideOption}\` has been set as the default guide`,
					ephemeral: true
				});
			} else if (subcommand === 'rename') {
				const oldName = interaction.options.getString('oldname');
				const newName = interaction.options.getString('newname');

				if (!guides.includes(oldName)) {
					await interaction.reply({
						content: `\`${oldName}\` is not in the list of guides`,
						ephemeral: true
					});
					return;
				}

				if (guides.includes(newName)) {
					await interaction.reply({
						content: `\`${newName}\` is already in the list of guides`,
						ephemeral: true
					});
					return;
				}

				await guildManager.renameGuide(oldName, newName);
				if (defaultGuide === oldName) {
					await guildManager.setDefaultGuide(newName);
				}
				await interaction.reply({
					content: `\`${oldName}\` has been renamed to \`${newName}\``,
					ephemeral: true
				});
			} else if (subcommand === 'list') {
				const guideList = guides.map(
					(guide) => `${guide} - Enabled: ${guildManager.getEnabled(guide)}`
				);
				const guideResponse = `Available guides: \n\`\`\`\n${guideList.join(
					'\n'
				)}\n\`\`\`\nDefault guide: \`${defaultGuide}\``;

				await interaction.reply({
					content: guideResponse,
					ephemeral: true
				});
			}
		} else if (subcommandGroup === 'file') {
			const guides = guildManager.getGuides();
			const defaultGuide = guildManager.getDefaultGuide();
			const guide = interaction.options.getString('guide') ?? defaultGuide;
			const enabled = guildManager.getEnabled(guide);
			const type = interaction.options.getString('filetype');

			if (!guides.includes(guide)) {
				await interaction.reply({
					content: `The guide \`${guide}\` does not exist in this server`,
					ephemeral: true
				});
				return;
			}

			if (subcommand === 'upload') {
				const uploadedFile = interaction.options.getAttachment('file');
				const logChannel = await interaction.client.channels.fetch(logChannelId);
				const logger = new Logger(logChannel);
				const remoteManager = new RemoteManager(logger);
				const fileContents = await remoteManager.fetch(uploadedFile.url);
				const fileName =
					type === 'reasons'
						? 'reasons.json'
						: type === 'loadorder'
						? 'loadorder.txt'
						: 'skips.txt';

				if (type === 'reasons') {
					try {
						JSON.parse(fileContents);
					} catch {
						await interaction.reply({ content: 'Invalid JSON provided', ephemeral: true });
						return;
					}
				}

				await guildManager.setFile(guide, fileContents, fileName);
				await interaction.reply({ content: `The ${type} file has been updated`, ephemeral: true });

				if (type === 'loadorder' && !enabled) {
					await guildManager.setEnabled(guide, true);
					await interaction.followUp({
						content: `Loadorder validation has been resumed for \`${guide}\``,
						ephemeral: true
					});
				}
			} else if (subcommand === 'retrieve') {
				let attachment;
				if (type === 'loadorder') {
					const fileContents = await guildManager.getLoadorder(guide);
					const buf = Buffer.from(fileContents, 'utf8');
					attachment = new AttachmentBuilder(buf, { name: 'loadorder.txt' });
				} else if (type === 'reasons') {
					const fileContents = await guildManager.getReasons(guide);
					const buf = Buffer.from(fileContents, 'utf8');
					attachment = new AttachmentBuilder(buf, { name: 'reasons.json' });
				} else if (type === 'skips') {
					const fileContents = await guildManager.getSkips(guide);
					const buf = Buffer.from(fileContents, 'utf8');
					attachment = new AttachmentBuilder(buf, { name: 'skips.txt' });
				}

				await interaction.reply({
					content: `Here is the current ${type} file for \`${guide}\``,
					files: [attachment],
					ephemeral: true
				});
			}
		}
	}
};
