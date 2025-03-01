import {
  App,
  Modal,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";

// Imports de BlockSuite
import { Store } from "@blocksuite/store";
import { BlockStd } from "@blocksuite/block-std";
import { InlineManager } from "@blocksuite/inline";
import * as Y from "yjs";
import { WebrtcProvider } from "y-webrtc";
import { IndexeddbPersistence } from "y-indexeddb";

interface Synapse_3Settings {
  noteSetting: string;
  collaboration: boolean;
  room: string;
}

const DEFAULT_SETTINGS: Synapse_3Settings = {
  noteSetting: "",
  collaboration: false,
  room: "synapse-default-room"
};

export default class Synapse_3 extends Plugin {
  settings: Synapse_3Settings;
  store: Store;
  doc: Y.Doc;
  provider: WebrtcProvider;
  persistence: IndexeddbPersistence;

  async onload() {
    console.log("Chargement du plugin Synapse 3");
    await this.loadSettings();

    // Initialisation de Yjs et BlockSuite
    this.doc = new Y.Doc();
    this.store = new Store(this.doc);
    
    if (this.settings.collaboration) {
      this.provider = new WebrtcProvider(this.settings.room, this.doc);
      this.persistence = new IndexeddbPersistence(this.settings.room, this.doc);
    }

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
    if (this.provider) {
      this.provider.destroy();
    }
    if (this.persistence) {
      this.persistence.destroy();
    }
    this.doc.destroy();
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

    new Setting(containerEl)
      .setName("Collaboration en temps réel")
      .setDesc("Activer la collaboration en temps réel")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.collaboration)
          .onChange(async (value) => {
            this.plugin.settings.collaboration = value;
            await this.plugin.saveSettings();
            
            if (value) {
              this.plugin.provider = new WebrtcProvider(this.plugin.settings.room, this.plugin.doc);
              this.plugin.persistence = new IndexeddbPersistence(this.plugin.settings.room, this.plugin.doc);
            } else {
              if (this.plugin.provider) {
                this.plugin.provider.destroy();
              }
              if (this.plugin.persistence) {
                this.plugin.persistence.destroy();
              }
            }
          })
      );

    new Setting(containerEl)
      .setName("Nom de la salle")
      .setDesc("Identifiant de la salle pour la collaboration")
      .addText((text) =>
        text
          .setPlaceholder("synapse-default-room")
          .setValue(this.plugin.settings.room)
          .onChange(async (value) => {
            this.plugin.settings.room = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
