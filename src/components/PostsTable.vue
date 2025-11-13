<template>
    <div class="p-6">
        <h1 class="text-2xl font-bold mb-4">Список постов</h1>

        <!-- поле поиска -->
        <input v-model="searchQuery" type="text" placeholder="Поиск по заголовку..."
            class="border rounded-lg px-3 py-2 mb-4 w-full focus:ring-2 focus:ring-blue-400 outline-none" />

        <div ref="scrollContainer" class="bg-white rounded-lg shadow overflow-y-auto border"
            style="height: 300px; width: 600px; margin: 0 auto;" @scroll="handleScroll">
            <table class="min-w-full text-left border-collapse">
                <thead class="bg-gray-100 sticky top-0">
                    <tr>
                        <th class="px-4 py-3 cursor-pointer" @click="sortBy('id')">
                            ID
                            <span v-if="sort.field === 'id'">
                                {{ sort.direction === 'asc' ? '↑' : '↓' }}
                            </span>
                        </th>
                        <th class="px-4 py-3 cursor-pointer" @click="sortBy('title')">
                            Заголовок
                            <span v-if="sort.field === 'title'">
                                {{ sort.direction === 'asc' ? '↑' : '↓' }}
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="post in visiblePosts" :key="post.id" class="border-t hover:bg-gray-50 transition">
                        <td class="px-4 py-4">{{ post.id }}</td>
                        <td class="px-4 py-4">{{ post.title }}</td>
                    </tr>
                </tbody>
            </table>

            <div v-if="loading" class="text-center py-4 text-gray-500">
                Загрузка...
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'

const posts = ref([])
const sort = ref({ field: 'id', direction: 'asc' })
const visiblePosts = ref([])
const itemsPerLoad = 25
const loading = ref(false)
const searchQuery = ref('')
const scrollContainer = ref(null)

// загрузка данных
onMounted(async () => {
    const res = await fetch('https://jsonplaceholder.typicode.com/posts')
    posts.value = await res.json()
    updateVisible()
    
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
    updateVisible(true)
}

// поиск
const filteredPosts = computed(() => {
    const q = searchQuery.value.toLowerCase()
    return posts.value.filter((p) => p.title.toLowerCase().includes(q))
})

// подгрузка при скролле
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

// обновление списка при изменении сортировки/поиска
const updateVisible = (reset = false) => {
    if (reset) visiblePosts.value = []
    visiblePosts.value = filteredPosts.value.slice(0, itemsPerLoad)
}

// следим за поиском
watch(searchQuery, () => {
    updateVisible(true)
})
</script>
