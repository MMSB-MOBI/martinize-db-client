export interface SettingsJson {
  force_fields: string[];
  martinize_versions: string[];
  category_tree: CategoryTree;
}

export interface CategoryTree {
  [go_id: string]: {
    children: CategoryTree,
    name: string;
  };
}
