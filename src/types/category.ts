export interface Category {
  id: string;
  workspaceId: string;
  name: string;
  icon: string; // lucide icon name, or an emoji fallback
  color: string; // hex or CSS var name
  layoutX: number;
  layoutY: number;
  layoutW: number;
  layoutH: number;
  isHidden: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CreateCategoryInput {
  workspaceId: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  icon?: string;
  color?: string;
}