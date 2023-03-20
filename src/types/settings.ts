export interface SettingsJson {
  force_fields: string[];
  create_way: { [wayId: string]: string };
  category_tree: CategoryTree;
  force_fields_info: ForceFieldsInfo
}

interface ForceFieldsInfo{
  [ff_name:string]:{
    polarizable:boolean
    type: "protein" | "supported" | "modified"
    downloadable : boolean
  }
}

export interface CategoryTree {
  [go_id: string]: {
    children: CategoryTree,
    name: string;
  };
}
