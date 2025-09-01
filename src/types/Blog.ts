export enum BlogCategory {
    Europe = "Europe",
    Asia = "Asia",
    Africa = "Africa",
    Australia = "Australia",
    Advice = "Advice",
    Inspiration = "Inspiration",
  }
  
  export enum BlogBlockType {
    Heading = "Heading",
    Paragraph = "Paragraph",
    Image = "Image",
    Gallery = "Gallery",
    Quote = "Quote",
    Divider = "Divider",
  }
  
  export interface FileResponse {
    id: string
    url: string
    fileName: string
    contentType: string
    size: number
  }
  
  export interface BlogBlockUpsert {
    order: number
    type: BlogBlockType
    payload: any
  }
  
  export interface BlogBlockResponse {
    order: number
    type: BlogBlockType
    payload: any
  }
  
  export interface BlogDetailResponse {
    id: string
    title: string
    agentName: string
    category: BlogCategory
    country?: string
    isPublished: boolean
    createdAt: string
    publishedAt?: string
    slug: string
    headerImage?: FileResponse
    blocks: BlogBlockResponse[]
  }
  
  export interface BlogSummaryResponse {
    id: string
    title: string
    agentName: string
    category: BlogCategory
    country?: string
    isPublished: boolean
    createdAt: string
    publishedAt?: string
    slug: string
    headerImage?: FileResponse
  }
  
  export interface BlogQueryParams {
    searchTerm?: string
    category?: BlogCategory
    sortBy?: string
    descending?: boolean
    pageNumber?: number
    pageSize?: number
  }
  
  export interface CreateBlogRequest {
    title: string
    category: BlogCategory
    country?: string
    headerImageFileId?: string
    blocks: BlogBlockUpsert[]
  }
  
  export interface EditBlogMetaRequest {
    title: string
    category: BlogCategory
    country?: string
    headerImageFileId?: string
  }
  
  export interface UpdateBlogBlocksRequest {
    blocks: BlogBlockUpsert[]
  }
  
  export interface PaginatedBlogResponse {
    items: BlogSummaryResponse[]
    totalCount: number
    pageNumber: number
    totalPages: number
    pageSize: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  
  export interface BlogFilters {
    searchTerm: string
    category?: BlogCategory
    sortBy: string
    descending: boolean
  }
  
  export const defaultBlogFilters: BlogFilters = {
    searchTerm: "",
    category: undefined,
    sortBy: "publishedAt",
    descending: true,
  }
  
  export interface HeadingPayload {
    level: number
    text: string
  }
  
  export interface ParagraphPayload {
    html: string
  }
  
  export interface QuotePayload {
    text: string
    author?: string
  }
  
  export interface DividerPayload {
    style?: string
  }
  
  export interface ImagePayload {
    fileId?: string
    fileName?: string
    file?: File
    caption?: string
    alt?: string
    width?: string
  }
  
  export interface GalleryPayload {
    fileIds?: string[]
    fileNames?: string[]
    files?: File[]
    caption?: string
    layout?: string
  }
  