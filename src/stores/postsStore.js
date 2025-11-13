import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const usePostsStore = defineStore('posts', () => {
  const posts = ref([])
  const users = ref([])
  const theme = ref(localStorage.getItem('theme') || 'dark')
  const viewedUsers = ref(JSON.parse(localStorage.getItem('viewedUsers') || '[]'))

  const sort = ref({ field: 'id', direction: 'asc' })
  const visiblePosts = ref([])
  const itemsPerLoad = 30

  const setTheme = (value) => {
    theme.value = value
    localStorage.setItem('theme', value)
  }

  const markUserViewed = (userId) => {
    if (!viewedUsers.value.includes(userId)) {
      viewedUsers.value.push(userId)
      localStorage.setItem('viewedUsers', JSON.stringify(viewedUsers.value))
    }
  }

  const sortedPosts = computed(() => {
    return [...posts.value].sort((a, b) => {
      const dir = sort.value.direction === 'asc' ? 1 : -1
      return a[sort.value.field] > b[sort.value.field] ? dir : -dir
    })
  })

  const updateVisible = (reset = false) => {
    if (reset) visiblePosts.value = []
    visiblePosts.value = sortedPosts.value.slice(0, itemsPerLoad)
  }

  const loadMore = () => {
    if (visiblePosts.value.length >= sortedPosts.value.length) return
    const next = sortedPosts.value.slice(
      visiblePosts.value.length,
      visiblePosts.value.length + itemsPerLoad
    )
    visiblePosts.value.push(...next)
  }

  return {
    posts,
    users,
    theme,
    viewedUsers,
    sort,
    visiblePosts,
    itemsPerLoad,
    setTheme,
    markUserViewed,
    sortedPosts,
    updateVisible,
    loadMore
  }
})
