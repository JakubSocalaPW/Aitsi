import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { PhotoSummary, PhotoDetail, PhotoSearchParams } from '@/types'
import { photosApi } from '@/api/photos.api'

export const usePhotosStore = defineStore('photos', () => {
  const items = ref<PhotoSummary[]>([])
  const currentPhoto = ref<PhotoDetail | null>(null)
  const myPhotos = ref<PhotoSummary[]>([])
  const isLoading = ref(false)

  const searchParams = ref<PhotoSearchParams>({
    page: 1,
    pageSize: 12,
    sortBy: 'relevance',
    sortDir: 'desc'
  })

  const pagination = ref({
    page: 1,
    pageSize: 12,
    totalCount: 0,
    totalPages: 0
  })

  const hasResults = computed(() => items.value.length > 0)
  const isEmpty = computed(() => !isLoading.value && items.value.length === 0)

  function setSearchParams(params: Partial<PhotoSearchParams>) {
    searchParams.value = { ...searchParams.value, ...params, page: params.page ?? 1 }
  }

  function resetSearch() {
    searchParams.value = { page: 1, pageSize: 12, sortBy: 'relevance', sortDir: 'desc' }
    items.value = []
    pagination.value = { page: 1, pageSize: 12, totalCount: 0, totalPages: 0 }
  }

  async function fetchPhotos(params?: Partial<PhotoSearchParams>) {
    isLoading.value = true
    try {
      const mergedParams = { ...searchParams.value, ...params }
      const response = await photosApi.search(mergedParams)
      items.value = response.items
      pagination.value = {
        page: response.page,
        pageSize: response.pageSize,
        totalCount: response.totalCount,
        totalPages: response.totalPages
      }
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPhoto(id: number) {
    isLoading.value = true
    try {
      currentPhoto.value = await photosApi.getById(id)
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMyPhotos() {
    isLoading.value = true
    try {
      const response = await photosApi.getMyPhotos()
      myPhotos.value = response.items
    } finally {
      isLoading.value = false
    }
  }

  async function uploadPhoto(formData: FormData): Promise<PhotoDetail> {
    isLoading.value = true
    try {
      const photo = await photosApi.upload(formData)
      return photo
    } finally {
      isLoading.value = false
    }
  }

  async function deletePhoto(id: number) {
    await photosApi.delete(id)
    items.value = items.value.filter(p => p.id !== id)
    myPhotos.value = myPhotos.value.filter(p => p.id !== id)
    if (currentPhoto.value?.id === id) currentPhoto.value = null
  }

  return {
    items, currentPhoto, myPhotos, isLoading,
    searchParams, pagination,
    hasResults, isEmpty,
    setSearchParams, resetSearch,
    fetchPhotos, fetchPhoto, fetchMyPhotos, uploadPhoto, deletePhoto
  }
})
