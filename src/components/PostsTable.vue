<template>
    <div class="p-6 bg-gray-100 w-full">
        <!-- Таблица постов -->
        <div>
            <h1 class="text-2xl font-bold mb-4">Список постов</h1>

            <!-- Поиск -->
            <input v-model="searchQuery" type="text" placeholder="Поиск по заголовку..."
                class="border rounded-lg px-3 py-2 mb-4 w-full focus:ring-2 focus:ring-blue-400 outline-none" />

            <div ref="scrollContainer" class="bg-white rounded-lg shadow overflow-y-auto border"
                style="height: 600px; width: 100%;" @scroll="handleScroll">
                <table class="min-w-full text-left border-collapse">
                    <thead class="bg-gray-100 sticky top-0">
                        <tr>
                            <th class="px-4 py-3 cursor-pointer" @click="sortBy('id')">
                                ID
                                <span v-if="sort.field === 'id'">{{ sort.direction === 'asc' ? '↑' : '↓' }}</span>
                            </th>
                            <th class="px-4 py-3 cursor-pointer" @click="sortBy('title')">
                                Заголовок
                                <span v-if="sort.field === 'title'">{{ sort.direction === 'asc' ? '↑' : '↓' }}</span>
                            </th>
                            <th class="px-4 py-3 cursor-pointer" @click="sortBy('userId')">
                                Автор
                                <span v-if="sort.field === 'userId'">{{ sort.direction === 'asc' ? '↑' : '↓' }}</span>
                            </th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr v-for="post in visiblePosts" :key="post.id" class="border-t hover:bg-gray-50 transition">
                            <td class="px-4 py-4">{{ post.id }}</td>
                            <td class="px-4 py-4">{{ post.title }}</td>
                            <td class="px-4 py-4 text-blue-600 cursor-pointer hover:underline"
                                @click="selectUser(post.userId)">
                                Пользователь #{{ post.userId }}
                            </td>
                        </tr>
                    </tbody>
                </table>

                <div v-if="loading" class="text-center py-4 text-gray-500">Загрузка...</div>
            </div>
        </div>

        <!-- Карточка пользователя под таблицей -->
        <transition name="slide-fade">
            <div v-if="selectedUser"
                class="mt-6 bg-gradient-to-b from-white to-gray-50 rounded-xl shadow-xl p-6 w-full border-t border-gray-200 flex flex-col gap-4">
                <div class="flex justify-between items-center">
                    <h2 class="text-2xl font-bold text-gray-800">Карточка пользователя</h2>
                    <button @click="selectedUser = null"
                        class="text-gray-400 hover:text-gray-600 transition text-xl font-bold">
                        ×
                    </button>
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
                            class="text-blue-600 hover:underline">
                            {{ selectedUser.website }}
                        </a>
                    </p>
                </div>

                <div class="border-b border-gray-200 pb-2">
                    <p class="text-gray-600"><strong>Компания:</strong> {{ selectedUser.company.name }}</p>
                    <p class="text-gray-600">
                        <strong>Адрес:</strong>
                        {{ selectedUser.address.street }}, {{ selectedUser.address.suite }}, {{
                        selectedUser.address.city }}
                    </p>
                </div>

                <button @click="selectedUser = null"
                    class="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                    Закрыть
                </button>
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
const itemsPerLoad = 25
const loading = ref(false)
const searchQuery = ref('')
const scrollContainer = ref(null)

const selectedUser = ref(null)

// Загрузка данных
onMounted(async () => {
    const resPosts = await fetch('https://jsonplaceholder.typicode.com/posts')
    posts.value = await resPosts.json()

    const resUsers = await fetch('https://jsonplaceholder.typicode.com/users')
    users.value = await resUsers.json()

    updateVisible()
})

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

// Фильтрация
const filteredPosts = computed(() => {
    const q = searchQuery.value.toLowerCase()
    return posts.value.filter((p) => p.title.toLowerCase().includes(q))
})

// Скролл
const handleScroll = () => {
    const el = scrollContainer.value
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && !loading.value) {
        loadMore()
    }
}

const loadMore = () => {
    if (visiblePosts.value.length >= filteredPosts.value.length) return
    loading.value = true
    setTimeout(() => {
        const next = filteredPosts.value.slice(
            visiblePosts.value.length,
            visiblePosts.value.length + itemsPerLoad
        )
        visiblePosts.value.push(...next)
        loading.value = false
    }, 500)
}

// Обновление видимых постов
const updateVisible = (reset = false) => {
    if (reset) visiblePosts.value = []
    visiblePosts.value = filteredPosts.value.slice(0, itemsPerLoad)
}

// Следим за поиском
watch(searchQuery, () => updateVisible(true))

// Выбор пользователя
const selectUser = (userId) => {
    selectedUser.value = users.value.find((u) => u.id === userId)
}
</script>

<style>
/* Анимация появления боковой панели */
.slide-fade-enter-active,
.slide-fade-leave-active {
    transition: all 0.3s ease;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
    opacity: 0;
    transform: translateX(20px);
}
</style>
