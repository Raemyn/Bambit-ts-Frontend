<template>
  <div :class="store.theme==='dark'?'bg-gray-900 text-gray-200':'bg-gray-100 text-gray-800'"
       class="min-h-screen flex justify-center items-start p-6">

    <div class="flex flex-col items-center gap-4 w-[600px] h-[576px]">

      <!-- Переключение темы -->
      <button @click="toggleTheme" class="mb-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700">
        Переключить тему
      </button>

      <!-- Заголовок -->
      <h1 class="text-3xl font-bold mb-4">Список постов</h1>

      <!-- Поиск -->
      <div class="flex w-full mb-4 gap-2">
        <input v-model="searchQuery" type="text" placeholder="Поиск по заголовку..."
               :class="store.theme==='dark'
                  ? 'bg-gray-800 text-gray-200 border-gray-700 placeholder-gray-400'
                  : 'bg-white text-gray-700 border-gray-300 placeholder-gray-400'"
               class="w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" />
        <button @click="fetchPosts" :disabled="loading"
                class="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition">
          <span v-if="loading" class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
          Поиск
        </button>
      </div>

      <!-- Таблица -->
      <div ref="scrollContainer"
           :class="store.theme==='dark'?'bg-gray-800 border-gray-700':'bg-white border-gray-300'"
           class="rounded-lg shadow overflow-y-auto border" @scroll="handleScroll">

        <table class="min-w-full text-left border-collapse">
          <thead :class="store.theme==='dark'?'bg-gray-700 text-gray-200':'bg-gray-200 text-gray-800'" class="sticky top-0">
            <tr>
              <th class="px-4 py-3 cursor-pointer border-b" @click="sortBy('id')">
                ID <span v-if="store.sort.field==='id'">{{ store.sort.direction==='asc'?'↑':'↓' }}</span>
              </th>
              <th class="px-4 py-3 cursor-pointer border-b" @click="sortBy('title')">
                Заголовок <span v-if="store.sort.field==='title'">{{ store.sort.direction==='asc'?'↑':'↓' }}</span>
              </th>
              <th class="px-4 py-3 cursor-pointer border-b" @click="sortBy('email')">
                Автор <span v-if="store.sort.field==='email'">{{ store.sort.direction==='asc'?'↑':'↓' }}</span>
              </th>
              <th class="px-4 py-3 cursor-pointer border-b" @click="sortBy('body')">
                Контент <span v-if="store.sort.field==='body'">{{ store.sort.direction==='asc'?'↑':'↓' }}</span>
              </th>
            </tr>
          </thead>

          <tbody>
            <template v-if="!loading">
              <tr v-for="post in store.visiblePosts" :key="post.id"
                  :class="store.theme==='dark'?'border-t border-gray-700 hover:bg-gray-700':'border-t border-gray-300 hover:bg-gray-100'"
                  class="transition">

                <td class="px-4 py-4" :title="post.id"
                    :class="store.theme==='dark'?'text-gray-200':'text-gray-800'">{{ post.id }}</td>

                <td class="px-4 py-4" :title="post.title"
                    :class="store.theme==='dark'?'text-gray-200':'text-gray-800'">{{ truncate(post.title,30) }}</td>

                <td class="px-4 py-4 cursor-pointer hover:underline" @click="openUserModal(post.userId)"
                    :title="post.email"
                    :class="store.viewedUsers.includes(post.userId)
                      ? (store.theme==='dark'?'text-gray-400':'text-gray-500')
                      : (store.theme==='dark'?'text-blue-400':'text-blue-600')">
                  {{ post.email }}
                </td>

                <td class="px-4 py-4" :title="post.body"
                    :class="store.theme==='dark'?'text-gray-200':'text-gray-800'">{{ truncate(post.body,40) }}</td>

              </tr>
            </template>

            <!-- Skeleton loader -->
            <template v-else>
              <tr v-for="n in store.itemsPerLoad" :key="n" class="animate-pulse">
                <td :class="store.theme==='dark'?'bg-gray-700':'bg-gray-300'" class="px-4 py-4 rounded">&nbsp;</td>
                <td :class="store.theme==='dark'?'bg-gray-700':'bg-gray-300'" class="px-4 py-4 rounded">&nbsp;</td>
                <td :class="store.theme==='dark'?'bg-gray-700':'bg-gray-300'" class="px-4 py-4 rounded">&nbsp;</td>
                <td :class="store.theme==='dark'?'bg-gray-700':'bg-gray-300'" class="px-4 py-4 rounded">&nbsp;</td>
              </tr>
            </template>
          </tbody>
        </table>

        <div v-if="loading" :class="store.theme==='dark'?'text-gray-400':'text-gray-600'" class="text-center py-4">
          Загрузка...
        </div>
      </div>
    </div>

    <!-- Модальное окно -->
    <transition name="fade">
      <div v-if="selectedUser" class="fixed inset-0 z-50 flex items-center justify-center">
        <!-- Фон -->
        <div @click="selectedUser=null" class="absolute inset-0 bg-black bg-opacity-70"></div>

        <!-- Окно -->
        <div class="relative w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all duration-300"
             :class="store.theme==='dark'?'bg-gray-800 text-gray-200':'bg-white text-gray-800'">
          <div class="flex justify-between items-center border-b pb-2"
               :class="store.theme==='dark'?'border-gray-700':'border-gray-300'">
            <h2 class="text-2xl font-bold">Карточка пользователя</h2>
            <button @click="selectedUser=null" class="text-gray-400 hover:text-gray-200 transition text-2xl font-bold">×</button>
          </div>
          <div class="space-y-2 mt-2">
            <p><strong>Имя:</strong> {{ selectedUser.name }}</p>
            <p><strong>Логин:</strong> {{ selectedUser.username }}</p>
            <p><strong>Email:</strong> {{ selectedUser.email }}</p>
            <p><strong>Телефон:</strong> {{ selectedUser.phone }}</p>
            <p><strong>Веб-сайт:</strong>
              <a :href="'https://'+selectedUser.website" target="_blank"
                 class="text-blue-400 hover:underline">{{ selectedUser.website }}</a>
            </p>
            <p><strong>Компания:</strong> {{ selectedUser.company.name }}</p>
            <p><strong>Адрес:</strong> {{ selectedUser.address.street }}, {{ selectedUser.address.suite }}, {{ selectedUser.address.city }}</p>
          </div>
          <button @click="selectedUser=null"
                  class="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow">
            Закрыть
          </button>
        </div>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { usePostsStore } from '../stores/postsStore'

const store = usePostsStore()

const searchQuery = ref('')
const loading = ref(false)
const scrollContainer = ref(null)
const selectedUser = ref(null)

// Загрузка данных
const fetchPosts = async () => {
  loading.value = true
  try {
    const resUsers = await fetch('https://jsonplaceholder.typicode.com/users')
    store.users = await resUsers.json()

    const queryParam = searchQuery.value ? `?title_like=${searchQuery.value}` : ''
    const resPosts = await fetch(`https://jsonplaceholder.typicode.com/posts${queryParam}`)
    const data = await resPosts.json()

    store.posts = data.map(p=>({
      ...p,
      email: store.users.find(u=>u.id===p.userId)?.email || 'неизвестно'
    }))
    store.updateVisible(true)
  } catch (e) {
    alert('Сервис временно недоступен. Попробуйте позже.')
    console.error(e)
  } finally {
    loading.value=false
  }
}

// Сортировка
const sortBy = (field) => {
  if (store.sort.field===field) store.sort.direction=store.sort.direction==='asc'?'desc':'asc'
  else { store.sort.field=field; store.sort.direction='asc' }
  store.updateVisible(true)
}

// Скролл
const handleScroll = () => {
  const el = scrollContainer.value
  if (el.scrollTop+el.clientHeight >= el.scrollHeight-10 && !loading.value) store.loadMore()
}

// Модальное окно
const openUserModal = (userId) => {
  selectedUser.value = store.users.find(u=>u.id===userId)
  store.markUserViewed(userId)
}

// Тема
const toggleTheme = () => store.setTheme(store.theme==='dark'?'light':'dark')

// Текст
const truncate = (text,len) => !text?'':text.length>len?text.slice(0,len)+'...':text

onMounted(fetchPosts)
</script>

<style>
.fade-enter-active,
.fade-leave-active { transition: all 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity:0; transform:scale(0.95); }
.fade-enter-to,
.fade-leave-from { opacity:1; transform:scale(1); }
</style>
