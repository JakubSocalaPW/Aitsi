<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>

<template>
  <footer class="footer" role="contentinfo">
    <div class="container">
      <nav class="footer__nav" aria-label="Linki stopki">
        <router-link to="/przegladaj" class="footer__link">{{ t('nav.browse') }}</router-link>
        <router-link to="/kroniki" class="footer__link">{{ t('nav.feed') }}</router-link>
        <router-link to="/mapa" class="footer__link">{{ t('nav.map') }}</router-link>
        <router-link to="/dodaj-zdjecie" class="footer__link">{{ t('nav.upload') }}</router-link>
      </nav>
      <p class="footer__copy">
        &copy; 2026 Cyfrowe Archiwum
      </p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: transparent;
  border-top: 1px solid var(--ghost-border);
  padding: 32px 0;
}

.footer__nav {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.footer__link {
  font-family: var(--font-label);
  font-size: var(--label-lg);
  font-weight: 500;
  color: var(--on-surface-variant);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer__link:hover {
  color: var(--primary);
}

.footer__copy {
  margin: 0;
  font-family: var(--font-label);
  font-size: var(--label-md);
  color: color-mix(in srgb, var(--on-surface-variant) 60%, transparent);
  text-align: center;
}
</style>
