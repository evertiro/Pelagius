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
	}
}

module.exports = {
	FileManager
};

function getDefaultSettings(guild) {
	const settings = {
		staff: [guild.ownerId]
	};

	return settings;
}
