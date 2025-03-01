import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

interface Synapse_3Settings {
  noteSetting: string;
}

const DEFAULT_SETTINGS: Synapse_3Settings = {
  noteSetting: "",
};

export default class Synapse_3 extends Plugin {
  settings: Synapse_3Settings;

  async onload() {
    console.log("Chargement du plugin Synapse 3");
    await this.loadSettings();

    this.addRibbonIcon("dice", "Synapse 3", () => {
      new Notice("Plugin Synapse 3 activé!");
    });

    this.addStatusBarItem().setText("Synapse 3");

    this.addCommand({
      id: "open-synapse-modal",
      name: "Ouvrir la fenêtre Synapse",
      checkCallback: (checking: boolean) => {
        let leaf = this.app.workspace.activeLeaf;
        if (leaf) {
          if (!checking) {
            new SynapseModal(this.app).open();
          }
          return true;
        }
        return false;
      },
    });

    this.addSettingTab(new SynapseSettingTab(this.app, this));

    // Enregistrement des événements CodeMirror
    this.registerCodeMirror((cm: CodeMirror.Editor) => {
      console.log("CodeMirror initialisé", cm);
    });

    // Enregistrement des événements de clic
    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      if (this.settings.noteSetting) {
        console.log("Clic détecté avec paramètre:", this.settings.noteSetting);
      }
    });
  }

  onunload() {
    console.log("Déchargement du plugin Synapse 3");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

class SynapseModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen() {
    let { contentEl } = this;
    contentEl.setText("Bienvenue dans Synapse 3!");
  }

  onClose() {
    let { contentEl } = this;
    contentEl.empty();
  }
}

class SynapseSettingTab extends PluginSettingTab {
  plugin: Synapse_3;

  constructor(app: App, plugin: Synapse_3) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    let { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Paramètres de Synapse 3" });

    new Setting(containerEl)
      .setName("Paramètre de note")
      .setDesc("Configurez votre paramètre de note personnalisé")
      .addText((text) =>
        text
          .setPlaceholder("Entrez votre paramètre")
          .setValue(this.plugin.settings.noteSetting)
          .onChange(async (value) => {
            this.plugin.settings.noteSetting = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
