<template>
  <div class="bg-gray-900 min-h-screen flex justify-center items-start p-6 text-gray-200">
    <div class="flex flex-col items-center gap-4  w-[600px] h-[576px]">

      <!-- Заголовок -->
      <h1 class="text-3xl font-bold mb-4 text-white">Список постов</h1>

      <!-- Поиск -->
      <div class="flex w-full mb-4 gap-2">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Поиск по заголовку..." 
          class="w-full px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-gray-200
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                 shadow-sm transition duration-200 placeholder-gray-400"
        >
        <button 
          @click="fetchPosts" 
          :disabled="loading"
          class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          <span v-if="loading" class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
          Поиск
        </button>
      </div>

      <!-- Таблица -->
      <div ref="scrollContainer" class="bg-gray-800 rounded-lg shadow overflow-y-auto border border-gray-700"
          @scroll="handleScroll">
        <table class="min-w-full text-left border-collapse">
          <thead class="bg-gray-700 sticky top-0">
            <tr>
              <th class="px-4 py-3 cursor-pointer" @click="sortBy('id')">
                ID <span v-if="sort.field === 'id'">{{ sort.direction === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-4 py-3 cursor-pointer" @click="sortBy('title')">
                Заголовок <span v-if="sort.field === 'title'">{{ sort.direction === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-4 py-3 cursor-pointer" @click="sortBy('email')">
                Автор <span v-if="sort.field === 'email'">{{ sort.direction === 'asc' ? '↑' : '↓' }}</span>
              </th>
              <th class="px-4 py-3 cursor-pointer" @click="sortBy('body')">
                Контент <span v-if="sort.field === 'body'">{{ sort.direction === 'asc' ? '↑' : '↓' }}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="post in visiblePosts" :key="post.id" 
                class="border-t border-gray-700 hover:bg-gray-700 transition">
              <td class="px-4 py-4">{{ post.id }}</td>
              <td class="px-4 py-4">{{ truncate(post.title, 30) }}</td>
              <td class="px-4 py-4 text-blue-400 cursor-pointer hover:underline"
                  @click="openUserModal(post.userId)">
                {{ post.email }}
              </td>
              <td class="px-4 py-4">{{ truncate(post.body, 40) }}</td>
            </tr>
          </tbody>
        </table>
        <div v-if="loading" class="text-center py-4 text-gray-400">Загрузка...</div>
      </div>
    </div>

    <!-- Модальное окно пользователя -->
    <transition name="fade">
      <div v-if="selectedUser" @click.self="selectedUser = null"
           class="fixed inset-0 flex items-center justify-center z-50">
        <!-- Полупрозрачный задник -->
        <div class="absolute inset-0 bg-black bg-opacity-70"></div>

        <!-- Само модальное окно -->
        <div class="relative bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col gap-6 z-10 transform transition-all duration-300">

          <!-- Заголовок -->
          <div class="flex justify-between items-center border-b border-gray-700 pb-2">
            <h2 class="text-2xl font-bold text-white">Карточка пользователя</h2>
            <button @click="selectedUser = null"
                    class="text-gray-400 hover:text-gray-200 transition text-2xl font-bold">×</button>
          </div>

          <!-- Информация -->
          <div class="space-y-2 text-gray-200">
            <p><strong>Имя:</strong> {{ selectedUser.name }}</p>
            <p><strong>Логин:</strong> {{ selectedUser.username }}</p>
            <p><strong>Email:</strong> {{ selectedUser.email }}</p>
            <p><strong>Телефон:</strong> {{ selectedUser.phone }}</p>
            <p>
              <strong>Веб-сайт:</strong>
              <a :href="'https://' + selectedUser.website" target="_blank"
                 class="text-blue-400 hover:underline">{{ selectedUser.website }}</a>
            </p>
            <p><strong>Компания:</strong> {{ selectedUser.company.name }}</p>
            <p><strong>Адрес:</strong> {{ selectedUser.address.street }}, {{ selectedUser.address.suite }}, {{ selectedUser.address.city }}</p>
          </div>

          <!-- Кнопка закрытия -->
          <button @click="selectedUser = null"
                  class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow">
            Закрыть
          </button>

        </div>
      </div>
    </transition>

  </div>
</template>


<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const posts = ref([])
const users = ref([])
const visiblePosts = ref([])
const sort = ref({ field: 'id', direction: 'asc' })
const itemsPerLoad = 30
const loading = ref(false)
const searchQuery = ref('')
const scrollContainer = ref(null)
const selectedUser = ref(null)

// Получение постов и пользователей
const fetchPosts = async () => {
    loading.value = true
    try {
        const resUsers = await fetch('https://jsonplaceholder.typicode.com/users')
        if (!resUsers.ok) throw new Error('Пользователи не загружены')
        users.value = await resUsers.json()

        const queryParam = searchQuery.value ? `?title_like=${searchQuery.value}` : ''
        const resPosts = await fetch(`https://jsonplaceholder.typicode.com/posts${queryParam}`)
        if (!resPosts.ok) throw new Error('Посты не загружены')
        const data = await resPosts.json()
        // Добавляем email автора к посту
        posts.value = data.map((p) => ({
            ...p,
            email: users.value.find((u) => u.id === p.userId)?.email || 'неизвестно',
        }))
        updateVisible(true)
    } catch (err) {
        alert('Сервис временно недоступен. Пожалуйста, попробуйте позже.')
        console.error(err)
    } finally {
        loading.value = false
    }
}

// Сортировка
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
    updateVisible(true)
}

// Фильтрация видимых постов
const filteredPosts = computed(() => posts.value)

// Скролл и динамическая подгрузка
const handleScroll = () => {
    const el = scrollContainer.value
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && !loading.value) {
        loadMore()
    }
}

const loadMore = () => {
    if (visiblePosts.value.length >= filteredPosts.value.length) return
    const next = filteredPosts.value.slice(
        visiblePosts.value.length,
        visiblePosts.value.length + itemsPerLoad
    )
    visiblePosts.value.push(...next)
}

// Обновление видимых постов
const updateVisible = (reset = false) => {
    if (reset) visiblePosts.value = []
    visiblePosts.value = filteredPosts.value.slice(0, itemsPerLoad)
}

// Следим за поиском
watch(searchQuery, () => fetchPosts())

// Открытие модального окна пользователя
const openUserModal = (userId) => {
    selectedUser.value = users.value.find((u) => u.id === userId)
}

// Обрезка текста с подсказкой
const truncate = (text, len) => {
    if (!text) return ''
    return text.length > len ? text.slice(0, len) + '...' : text
}

// Автозагрузка при старте
onMounted(fetchPosts)
</script>

<style>
.fade-enter-active,
.fade-leave-active {
    transition: all 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: scale(0.95);
}

.fade-enter-to,
.fade-leave-from {
    opacity: 1;
    transform: scale(1);
}
</style>
