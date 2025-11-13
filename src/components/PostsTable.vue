<template>
    <div class="bg-gray-100 min-h-screen flex justify-center items-start p-6">
        <div class="flex flex-col items-center gap-4">
            <!-- Заголовок -->
            <h1 class="text-2xl font-bold mb-4">Список постов</h1>

            <!-- Поиск -->
            <div class="flex w-full mb-4 gap-2">
                <input v-model="searchQuery" type="text" placeholder="Поиск по заголовку..." class="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700
         focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
         shadow-sm transition duration-200 placeholder-gray-400">
                <button @click="fetchPosts" :disabled="loading"
                    class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2">
                    <span v-if="loading"
                        class="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent"></span>
                    Поиск
                </button>
            </div>

            <!-- Таблица -->
            <div ref="scrollContainer" class="bg-white rounded-lg shadow overflow-y-auto border"
                style="width: 600px; height: 510px;" @scroll="handleScroll">
                <table class="min-w-full text-left border-collapse">
                    <thead class="bg-gray-100 sticky top-0">
                        <tr>
                            <th class="px-4 py-3 cursor-pointer" @click="sortBy('id')">
                                ID <span v-if="sort.field === 'id'">{{ sort.direction === 'asc' ? '↑' : '↓' }}</span>
                            </th>
                            <th class="px-4 py-3 cursor-pointer" @click="sortBy('title')">
                                Заголовок <span v-if="sort.field === 'title'">{{ sort.direction === 'asc' ? '↑' : '↓'
                                    }}</span>
                            </th>
                            <th class="px-4 py-3 cursor-pointer" @click="sortBy('email')">
                                Автор <span v-if="sort.field === 'email'">{{ sort.direction === 'asc' ? '↑' : '↓'
                                    }}</span>
                            </th>
                            <th class="px-4 py-3 cursor-pointer" @click="sortBy('body')">
                                Контент <span v-if="sort.field === 'body'">{{ sort.direction === 'asc' ? '↑' : '↓'
                                    }}</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="post in visiblePosts" :key="post.id" class="border-t hover:bg-gray-50 transition">
                            <td class="px-4 py-4" :title="post.id">{{ post.id }}</td>
                            <td class="px-4 py-4" :title="post.title">{{ truncate(post.title, 30) }}</td>
                            <td class="px-4 py-4 text-blue-600 cursor-pointer hover:underline"
                                @click="openUserModal(post.userId)" :title="post.email">
                                {{ post.email }}
                            </td>
                            <td class="px-4 py-4" :title="post.body">{{ truncate(post.body, 40) }}</td>
                        </tr>
                    </tbody>
                </table>
                <div v-if="loading" class="text-center py-4 text-gray-500">Загрузка...</div>
            </div>
        </div>

        <!-- Модальное окно пользователя -->
        <transition name="fade" class="flex m-[30px] p-[5px]">
            <div v-if="selectedUser" @click.self="selectedUser = null">
                <div class="bg-white rounded-xl shadow-xl p-6 w-full max-w-md flex flex-col gap-4 relative">
                    <div class="flex justify-between items-center">
                        <h2 class="text-2xl font-bold text-gray-800">Карточка пользователя</h2>
                        <button @click="selectedUser = null"
                            class="text-gray-400 hover:text-gray-600 transition text-xl font-bold">×</button>
                    </div>

                    <div class="border-b border-gray-200 pb-2">
                        <p class="text-gray-600"><strong>Имя:</strong> {{ selectedUser.name }}</p>
                        <p class="text-gray-600"><strong>Логин:</strong> {{ selectedUser.username }}</p>
                        <p class="text-gray-600"><strong>Email:</strong> {{ selectedUser.email }}</p>
                    </div>

                    <div class="border-b border-gray-200 pb-2">
                        <p class="text-gray-600"><strong>Телефон:</strong> {{ selectedUser.phone }}</p>
                        <p class="text-gray-600">
                            <strong>Веб-сайт:</strong>
                            <a :href="'https://' + selectedUser.website" target="_blank"
                                class="text-blue-600 hover:underline">{{ selectedUser.website }}</a>
                        </p>
                    </div>

                    <div class="border-b border-gray-200 pb-2">
                        <p class="text-gray-600"><strong>Компания:</strong> {{ selectedUser.company.name }}</p>
                        <p class="text-gray-600">
                            <strong>Адрес:</strong> {{ selectedUser.address.street }}, {{ selectedUser.address.suite }},
                            {{ selectedUser.address.city }}
                        </p>
                    </div>

                    <button @click="selectedUser = null"
                        class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
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
    transform: translateY(10px);
}
</style>
