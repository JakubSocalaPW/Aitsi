export interface Category {
  id: number
  name: string
  description?: string
  parentId?: number | null
}

export interface CategoryNode extends Category {
  children: CategoryNode[]
  photoCount?: number
}

export interface CategoryCreatePayload {
  name: string
  parentId?: number | null
  description?: string
}
