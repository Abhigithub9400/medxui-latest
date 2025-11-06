<template>
  <div class="pagination">
    <div class="controls">
      <!-- First page -->
      <button class="icon-btn" @click="goToPage(1)" :disabled="currentPage === 1">
        <img src="~/assets/icons/chevron-double-left.svg" alt="First page" class="dbl flip" />
      </button>

      <!-- Previous page -->
      <button class="icon-btn" @click="goToPage(currentPage - 1)" :disabled="currentPage === 1">
        <img src="~/assets/icons/chevron-left.svg" alt="Previous page" class="sgl flip" />
      </button>

      <!-- Page numbers -->
      <button
        v-for="page in visiblePages"
        :key="page"
        class="page-btn"
        :class="{ active: page === currentPage }"
        @click="goToPage(page)"
      >
        {{ page }}
      </button>

      <!-- Next page -->
      <button class="icon-btn" @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages">
        <img src="~/assets/icons/chevron-right.svg" alt="Next page" class="sgl" />
      </button>

      <!-- Last page -->
      <button class="icon-btn" @click="goToPage(totalPages)" :disabled="currentPage === totalPages">
        <img src="~/assets/icons/chevron-double-right.svg" alt="Last page" class="dbl" />
      </button>

      <!-- Page size -->
      <div class="page-size-wrapper">
        <select class="page-size" v-model="pageSize" @change="changePageSize">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
        <img src="~/assets/icons/chevron-down.svg" alt="Dropdown" class="caret" />
      </div>
    </div>

    <span class="total-text">
      {{ startItem }}-{{ endItem }} of {{ props.totalItems.toLocaleString() }}
    </span>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  totalItems: { type: Number, required: true },
  pageSizeOptions: { type: Array, default: () => [10, 20, 50] }
})
const emit = defineEmits(['update:page', 'update:pageSize'])

const currentPage = ref(1)
const pageSize = ref(props.pageSizeOptions[0])

const totalPages = computed(() => Math.ceil(props.totalItems / pageSize.value))

const visiblePages = computed(() => {
  const pages = []
  for (let i = 1; i <= totalPages.value; i++) {
    pages.push(i)
  }
  return pages
})

const startItem = computed(() => (currentPage.value - 1) * pageSize.value + 1)
const endItem = computed(() => Math.min(currentPage.value * pageSize.value, props.totalItems))

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    emit('update:page', page)
  }
}

function changePageSize() {
  currentPage.value = 1
  emit('update:pageSize', pageSize.value)
}
</script>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 0px; /* align with table */
}

.controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  background: none;
  border: none;
  padding: 6px;
  border-radius: 50%;
  cursor: pointer;
  color: #333;
}
.icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.dbl { display: block; width: 16px; height: 16px; }
.sgl { display: block; width: 16px; height: 16px; }
.flip { transform: scaleX(-1); }

.page-btn {
  background: none;
  border: 1px solid transparent;
  padding: 6px 10px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  color: #1c1c1c;
}
.page-btn.active {
  background-color: #0066D4;
  color: #fff;
}
.page-btn:hover:not(.active) { background-color: #f0f0f0; }

.page-size-wrapper {
  position: relative;
}
.page-size {
  padding: 6px 28px 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  appearance: none;
  background: #fff;
}
.caret {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  width: 16px;
  height: 16px;
}

.total-text {
  margin-left: auto;
  font-size: 14px;
  color: #555;
}
</style>
