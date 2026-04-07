import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import i18n from './i18n'
import router from './router'
import App from './App.vue'

import './styles/tokens.css'
import './styles/reset.css'
import './styles/base.css'
import './styles/utilities.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
app.use(PrimeVue, { unstyled: true })

app.mount('#app')
