const fsPromises = require('node:fs/promises');
const path = require('node:path');

class FileManager {
	constructor() {}

	async createDataFolder() {
		const dataFolder = path.join(__dirname, '..', 'data');
		try {
			await fsPromises.access(dataFolder);
		} catch {
			await fsPromises.mkdir(dataFolder);
		}
	}

	async createGuildFiles(guild) {
		const id = guild.id;
		const dataFolder = path.join(__dirname, '..', 'data', id);
		const dataFile = path.join(dataFolder, 'settings.json');
		const defaultGuideFolder = path.join(__dirname, '..', 'data', id, 'default');

		try {
			await fsPromises.access(dataFolder);
		} catch {
			await fsPromises.mkdir(dataFolder);
		}

		try {
			await fsPromises.access(dataFile);
		} catch {
			await fsPromises.writeFile(dataFile, JSON.stringify(getDefaultSettings(guild)));
		}

		try {
			await fsPromises.access(defaultGuideFolder);
		} catch {
			await fsPromises.mkdir(defaultGuideFolder);
		}
	}

	async getGuildSettings(guildId) {
		const settingsFile = path.join(__dirname, '..', 'data', guildId, 'settings.json');

		try {
			const settings = JSON.parse(await fsPromises.readFile(settingsFile));
			return settings;
		} catch {
			const defaultSettings = getDefaultSettings(guild);
			await fsPromises.writeFile(settingsFile, JSON.stringify(defaultSettings));
			return defaultSettings;
		}
	}

	async getLoadorderFile(guildId, guide) {
		const loadorderFile = path.join(__dirname, '..', 'data', guildId, guide, 'loadorder.txt');

		try {
			return (await fsPromises.readFile(loadorderFile, { encoding: 'utf8' }))
				.toLowerCase()
				.split(/\r?\n/);
		} catch {
			return null;
		}
	}

	async getReasonsFile(guildId, guide) {
		const reasonsFile = path.join(__dirname, '..', 'data', guildId, guide, 'reasons.json');

		try {
			return JSON.parse(
				(await fsPromises.readFile(reasonsFile, { encoding: 'utf8' })).toLowerCase()
			);
		} catch {
			return JSON.parse('{}');
		}
	}

	async getSkipsFile(guildId, guide) {
		const skipsFile = path.join(__dirname, '..', 'data', guildId, guide, 'skips.txt');

		try {
			return (await fsPromises.readFile(skipsFile, { encoding: 'utf8' }))
				.toLowerCase()
				.split(/\r?\n/);
		} catch {
			return [];
		}
	}
}

module.exports = {
	FileManager
};

function getDefaultSettings(guild) {
	const settings = {
		staff: [guild.ownerId],
		guides: ['default'],
		defaultGuide: 'default'
	};

	return settings;
}
