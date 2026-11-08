import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import HomeView from '../HomeView.vue'
import HomeLink from '../HomeLink.vue'
import { subApps } from '../subapps'

const Blank = { template: '<div />' }

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/', component: Blank }, ...subApps.map((app) => ({ path: app.path, component: Blank }))],
  })
}

describe('HomeView', () => {
  it('shows one tile per sub-app, in registry order, each linking to its page', async () => {
    const router = makeRouter()
    await router.push('/')
    const wrapper = mount(HomeView, { global: { plugins: [router] } })

    const tiles = wrapper.findAll('a')
    expect(tiles.map((t) => t.text())).toEqual(subApps.map((app) => `${app.icon}${app.title}`))
    expect(tiles.map((t) => t.attributes('href'))).toEqual(subApps.map((app) => app.path))
  })
})

describe('HomeLink', () => {
  it('is hidden on the home page itself', async () => {
    const router = makeRouter()
    await router.push('/')
    const wrapper = mount(HomeLink, { global: { plugins: [router] } })
    expect(wrapper.find('a').exists()).toBe(false)
  })

  it('links back to the home page from inside a sub-app', async () => {
    const router = makeRouter()
    await router.push(subApps[0].path)
    const wrapper = mount(HomeLink, { global: { plugins: [router] } })
    const link = wrapper.find('a')
    expect(link.text()).toContain('Home')
    expect(link.attributes('href')).toBe('/')
  })
})
