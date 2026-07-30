import { ref } from 'vue'
import { getAllCategories, DEFAULT_CATEGORIES, type Category } from '../db'

const _items = ref<Category[]>(DEFAULT_CATEGORIES)
let _loaded = false

export function useCategoriesStore() {
  return {
    items: _items,
    async load() {
      if (_loaded) return
      const cats = await getAllCategories()
      if (cats.length) _items.value = cats
      _loaded = true
    },
  }
}
