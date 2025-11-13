<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-4">Список постов</h1>

    <div class="overflow-x-auto bg-white rounded-lg shadow">
      <table class="min-w-full text-left border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th
              class="px-4 py-3 cursor-pointer"
              @click="sortBy('id')"
            >
              ID
              <span v-if="sort.field === 'id'">
                {{ sort.direction === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
            <th
              class="px-4 py-3 cursor-pointer"
              @click="sortBy('title')"
            >
              Заголовок
              <span v-if="sort.field === 'title'">
                {{ sort.direction === 'asc' ? '↑' : '↓' }}
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="post in paginatedPosts"
            :key="post.id"
            class="border-t hover:bg-gray-50 transition"
          >
            <td class="px-4 py-2">{{ post.id }}</td>
            <td class="px-4 py-2">{{ post.title }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- пагинация -->
    <div class="flex justify-center mt-4 space-x-2">
      <button
        v-for="page in totalPages"
        :key="page"
        @click="currentPage = page"
        :class="[
          'px-3 py-1 rounded-lg border',
          currentPage === page ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
        ]"
      >
        {{ page }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const posts = ref([])
const sort = ref({ field: 'id', direction: 'asc' })
const currentPage = ref(1)
const perPage = 10

// загрузка данных
onMounted(async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts')
  posts.value = await res.json()
})

// сортировка
const sortBy = (field) => {
  if (sort.value.field === field) {
    sort.value.direction = sort.value.direction === 'asc' ? 'desc' : 'asc'
  } else {
    sort.value.field = field
    sort.value.direction = 'asc'
  }

  posts.value.sort((a, b) => {
    const dir = sort.value.direction === 'asc' ? 1 : -1
    return a[field] > b[field] ? dir : -dir
  })
}

// пагинация
const totalPages = computed(() => Math.ceil(posts.value.length / perPage))
const paginatedPosts = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return posts.value.slice(start, start + perPage)
})
</script>
