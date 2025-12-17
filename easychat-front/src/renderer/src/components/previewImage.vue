<template>
  <div v-if="visible" class="image-preview-modal" @click="onOverlayClick">
    <div class="image-preview-overlay">
      <div class="image-container">
        <img :src="imageUrl" class="preview-image" />
        <button class="close-button" @click="close">×</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits } from 'vue'

const props = defineProps({
  imageUrl: {
    type: String,
    required: true
  },
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}

const onOverlayClick = (e) => {
  if (e.target.classList.contains('image-preview-overlay')) {
    close()
  }
}
</script>

<style scoped>
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.image-preview-overlay {
  position: relative;
  max-width: 90%;
  max-height: 90%;
}

.image-container {
  position: relative;
  max-width: 100%;
  max-height: 80vh;
}

.preview-image {
  max-width: 100%;
  max-height: 80vh;
  border-radius: 4px;
  display: block;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
