import type { RouteRecordRaw } from 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    requiresAuth?: boolean
    requiresAdmin?: boolean
    guestOnly?: boolean
    hideFooter?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'landing',
    component: () => import('@/pages/LandingPage.vue'),
    meta: { title: 'Cyfrowe Archiwum', hideFooter: true }
  },
  {
    path: '/archiwum',
    redirect: '/przegladaj'
  },
  {
    path: '/kroniki',
    name: 'feed',
    component: () => import('@/pages/FeedPage.vue'),
    meta: { title: 'Kroniki spolecznosci', hideFooter: true }
  },
  {
    path: '/mapa',
    name: 'map-browser',
    component: () => import('@/pages/MapBrowserPage.vue'),
    meta: { title: 'Mapa archiwum', hideFooter: true }
  },
  {
    path: '/przegladaj',
    name: 'browse',
    component: () => import('@/pages/BrowsePage.vue'),
    meta: { title: 'Przegladaj archiwum' }
  },
  {
    path: '/przegladaj/:categoryId',
    name: 'browse-category',
    component: () => import('@/pages/BrowsePage.vue'),
    meta: { title: 'Kategoria' },
    props: true
  },
  {
    path: '/zdjecie/:id',
    name: 'photo-detail',
    component: () => import('@/pages/PhotoDetailPage.vue'),
    meta: { title: 'Zdjecie' },
    props: true
  },
  {
    path: '/logowanie',
    name: 'login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { title: 'Logowanie', guestOnly: true }
  },
  {
    path: '/moje-zdjecia',
    name: 'my-photos',
    component: () => import('@/pages/MyPhotosPage.vue'),
    meta: { title: 'Moje zdjecia', requiresAuth: true }
  },
  {
    path: '/dodaj-zdjecie',
    name: 'upload-photo',
    component: () => import('@/pages/UploadPhotoPage.vue'),
    meta: { title: 'Dodaj zdjecie', requiresAuth: true }
  },
  {
    path: '/edytuj-zdjecie/:id',
    name: 'edit-photo',
    component: () => import('@/pages/EditPhotoPage.vue'),
    meta: { title: 'Edytuj zdjecie', requiresAuth: true },
    props: true
  },
  {
    path: '/panel-tworcy',
    name: 'creator-dashboard',
    component: () => import('@/pages/CreatorDashboardPage.vue'),
    meta: { title: 'Panel tworcy', requiresAuth: true, hideFooter: true }
  },
  {
    path: '/admin',
    name: 'admin-dashboard',
    component: () => import('@/pages/AdminDashboardPage.vue'),
    meta: { title: 'Panel administracyjny', requiresAuth: true, requiresAdmin: true, hideFooter: true }
  },
  {
    path: '/admin/uzytkownicy',
    name: 'admin-users',
    component: () => import('@/pages/AdminUsersPage.vue'),
    meta: { title: 'Zarzadzanie uzytkownikami', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/admin/kategorie',
    name: 'admin-categories',
    component: () => import('@/pages/AdminCategoriesPage.vue'),
    meta: { title: 'Zarzadzanie kategoriami', requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('@/pages/NotFoundPage.vue'),
    meta: { title: 'Nie znaleziono strony' }
  }
]

export default routes
