import {convertLinksInVault} from "converter"
import {Plugin} from "obsidian"

interface PluginSettings {}

const DEFAULT_SETTINGS: PluginSettings = {}

export default class LinkFixerPlugin extends Plugin {
    settings: PluginSettings

    async onload() {
        await this.loadSettings()

        this.addCommand({
            id: "convert-wikis-to-md-in-vault",
            name: "Fix all links in vault",
            callback: () => {
                convertLinksInVault(this)
            },
        })
    }

    onunload() {}

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData())
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }
}
