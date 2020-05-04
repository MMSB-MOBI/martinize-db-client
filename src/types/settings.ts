export interface SettingsJson {
  force_fields: string[];
  create_way: { [wayId: string]: string };
  category_tree: CategoryTree;
}

export interface CategoryTree {
  [go_id: string]: {
    children: CategoryTree,
    name: string;
  };
}
