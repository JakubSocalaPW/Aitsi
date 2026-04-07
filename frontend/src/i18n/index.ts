import { createI18n } from 'vue-i18n'
import pl from './locales/pl.json'

const i18n = createI18n({
  locale: 'pl',
  fallbackLocale: 'pl',
  messages: { pl },
  legacy: false
})

export default i18n
