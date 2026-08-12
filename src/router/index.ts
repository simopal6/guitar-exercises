import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import { subApps } from '../shell/subapps'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: subApps[0].path },
  ...subApps.map((app) => ({ path: app.path, name: app.id, component: app.component })),
]

export const router = createRouter({
  // Hash history (e.g. ".../#/intervals") instead of createWebHistory:
  // GitHub Pages is a static host with no server-side rewrite rule, so a
  // hard refresh or direct link on a non-root path would otherwise 404.
  history: createWebHashHistory(),
  routes,
})
