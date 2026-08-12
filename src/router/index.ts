import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { subApps } from '../shell/subapps'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: subApps[0].path },
  ...subApps.map((app) => ({ path: app.path, name: app.id, component: app.component })),
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})
