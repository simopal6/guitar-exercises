import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { subApps } from '../shell/subapps'
import HomeView from '../shell/HomeView.vue'

export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomeView },
  ...subApps.map((app) => ({ path: app.path, name: app.id, component: app.component })),
  // Unknown or outdated links land on the home page instead of a blank screen
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  // Hash history (e.g. ".../#/intervals") instead of createWebHistory:
  // GitHub Pages is a static host with no server-side rewrite rule, so a
  // hard refresh or direct link on a non-root path would otherwise 404.
  history: createWebHashHistory(),
  routes,
})
