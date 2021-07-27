import LocalForage from 'localforage';
import uuid from 'uuid/v4';
import { BaseBondsHelperJSON } from './components/Builder/BaseBondsHelper';
import { GoBondsHelperJSON } from './components/Builder/GoBondsHelper';

/**
 * Tuple of two integers: [{from} atom index, {to} atom index]
 */
export type ElasticOrGoBounds = [number, number];

export interface StashedBuildInfo {
  created_at: Date;
  name: string;
  
  builder_force_field: string;
  builder_mode: 'go' | 'classic' | 'elastic';
  builder_positions: 'none' | 'all' | 'backbone';
  builder_ef: string;
  builder_el: string;
  builder_eu: string;
  builder_ea: string;
  builder_ep: string;
  builder_em: string;
  cTer: string;
  nTer: string;
  sc_fix: string;
  cystein_bridge: string;

  advanced: string;
  commandline: string;
  stdout : string[]; //To handle warnings
}

export interface MartinizeFile {
  name: string;
  content: File;
  type: string;
}

export interface StashedBuild {
  all_atom: File;
  coarse_grained: MartinizeFile;
  itp_files: MartinizeFile[];
  top_file: MartinizeFile;
  radius: { [atomName: string]: number };
  elastic_bonds?: ElasticOrGoBounds[];
  info: StashedBuildInfo;
  go?: BaseBondsHelperJSON | GoBondsHelperJSON;
}

/**
 * Store build made with MoleculeBuilder.
 * 
 * Two stores: 
 *  "available" => store StashedBuildInfo by uuid
 *  "saved" => store StashedBuild by uuid
 *
 */
export default class StashedBuildHelper {
  protected static readonly STORE_NAME_INFOS = "MoleculeSaveInfo";
  protected static readonly STORE_NAME_SAVES = "MoleculeSave";
  protected static asked_persistence = false;

  protected store_infos = LocalForage.createInstance({
    driver: LocalForage.INDEXEDDB,
    name: StashedBuildHelper.STORE_NAME_INFOS,
    storeName: StashedBuildHelper.STORE_NAME_INFOS,
  });

  protected store_saves = LocalForage.createInstance({
    driver: LocalForage.INDEXEDDB,
    name: StashedBuildHelper.STORE_NAME_SAVES,
    storeName: StashedBuildHelper.STORE_NAME_SAVES,
  });

  async add(build: StashedBuild, use_uuid?: string) {
    if (
      StashedBuildHelper.can_work && 
      !StashedBuildHelper.asked_persistence && 
      navigator.storage && 
      navigator.storage.persisted
    ) {
      // Ask for persistency
      await navigator.storage.persisted()
        .then(is_persistent => {
          if (!is_persistent) {
            console.log("Storage for saves is not persistent, trying to be persistent.");
            StashedBuildHelper.askForPersistence();
          }
        })
        .catch(() => {});
    }

    const id = use_uuid ?? uuid();

    await this.store_infos.setItem(id, build.info);
    await this.store_saves.setItem(id, build);
    
    return id;
  }

  async get(uuid: string) : Promise<StashedBuild | undefined> {
    const build = this.store_saves.getItem<StashedBuild>(uuid);

    if (build) {
      return build;
    }
    return undefined;
  }

  async exists(uuid: string) {
    const info = await this.store_infos.getItem<StashedBuildInfo>(uuid);
    
    return !!info;
  }

  async checkName(name: string) {
    //const molecule = await this.store_infos.iterate()
  }

  async list() {
    const items: { [uuid: string]: StashedBuildInfo } = {};

    for await (const [key, value] of this) {
      items[key] = value;
    }

    return items;
  }

  async remove(uuid: string) {
    await this.store_saves.removeItem(uuid);
    await this.store_infos.removeItem(uuid);
  }

  /**
   * Iterate over entries, in the form [uuid, StashedBuildInfo]
   */
  async *[Symbol.asyncIterator]() : AsyncGenerator<[string, StashedBuildInfo], void, void> {
    const keys = await this.store_infos.keys();

    for (const key of keys) {
      const value = await this.store_infos.getItem<StashedBuildInfo>(key);
      yield [key, value];
    }
  }

  // ----
  // MISC
  // ----

  /**
   * Percentage usage of storage quota. Warning: this does **not** work in Safari !
   */
  async usedQuota() {
    if (navigator.storage && navigator.storage.estimate) {
      const estimated = await navigator.storage.estimate();
      return {
        available: estimated.quota,
        used: estimated.usage,
        quota: estimated.usage! / estimated.quota!
      };
    }
    return {
      available: 1,
      used: 0,
      quota: 0
    };
  }

  /**
   * Ask for storage persistency.
   */
  protected static async askForPersistence() {
    StashedBuildHelper.asked_persistence = true;

    if (navigator.storage) {
      return navigator.storage.persist()
        .then(has_succeeded => {
          if (!has_succeeded) {
            console.warn("Persistence demand failed or rejected. Storage may be wiped in the future.");
          }
        })
        .catch(e => console.error("Unable to ask for persistency", e))
    }
  }

  /**
   * `true` if the archive save system can work.
   */
  static get can_work() {
    return LocalForage.supports(LocalForage.INDEXEDDB);
  }
}

// @ts-ignore
DEBUG.StashedBuildHelper = StashedBuildHelper;
