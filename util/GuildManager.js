const { FileManager } = require('./FileManager.js');

class GuildManager {
	constructor(guild) {
		this._fileManager = new FileManager();
		this._guild = guild;
	}

	async init() {
		this._settings = await this._fileManager.getGuildSettings(this._guild.id);
	}

	getSettings() {
		return this._settings;
	}

	getGuides() {
		return this._settings.guides;
	}

	getDefaultGuide() {
		return this._settings.defaultGuide;
	}

	async getLoadorder(guide) {
		return this._fileManager.getLoadorderFile(this._guild.id, guide);
	}

	async getReasons(guide) {
		return this._fileManager.getReasonsFile(this._guild.id, guide);
	}

	async getSkips(guide) {
		return this._fileManager.getSkipsFile(this._guild.id, guide);
	}
}

module.exports = {
	GuildManager
};
