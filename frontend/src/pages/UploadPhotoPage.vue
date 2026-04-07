<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import PhotoUploadForm from '@/components/forms/PhotoUploadForm.vue'

const router = useRouter()
const { t } = useI18n()

function handleSuccess() {
  router.push({ name: 'my-photos' })
}
</script>

<template>
  <div class="container">
    <h1 class="page-title">{{ t('upload.title') }}</h1>
    <div class="upload-wrapper">
      <PhotoUploadForm @success="handleSuccess" @cancel="router.back()" />
    </div>
  </div>
</template>

<style scoped>
.container {
  max-width: var(--container-max);
  margin: 0 auto;
  padding: 32px 16px;
}

@media (min-width: 768px) {
  .container {
    padding: 32px 24px;
  }
}

.page-title {
  font-family: var(--font-headline);
  font-size: var(--headline-lg);
  font-weight: 400;
  color: var(--on-surface);
  margin-bottom: 32px;
}

.upload-wrapper {
  max-width: 700px;
}
</style>
