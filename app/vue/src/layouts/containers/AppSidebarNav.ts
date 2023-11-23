import { defineComponent, h, ref, resolveComponent, computed } from 'vue'
import { useAccount } from '@/store/pinia/account'
import { RouterLink, useRoute, type RouteLocation } from 'vue-router'

import { CBadge, CNavGroup, CNavItem, CSidebarNav, CNavTitle } from '@coreui/vue'
import { CIcon } from '@coreui/icons-vue'
import nav from '@/layouts/_nav'

type Badge = {
  color?: string
  text?: string
}

type Item = {
  badge?: Badge
  component: string
  icon?: string
  items?: Item[]
  name?: string
  to?: string
}
const isStaff = computed(
  () => useAccount().superAuth || Number(useAccount().staffAuth?.is_staff || null),
)

const isCash = computed(
  () => useAccount().superAuth || Number(useAccount().staffAuth?.company_cash || null),
)

const normalizePath = (path: string) =>
  decodeURI(path)
    .replace(/#.*$/, '')
    .replace(/(index)?\.(html)$/, '')

const isActiveLink = (route: RouteLocation, link: string) => {
  if (link === undefined) return false

  if (route.hash === link) return true

  const currentPath = normalizePath(route.path)
  const targetPath = normalizePath(link)

  return currentPath === targetPath
}

const isActiveItem = (route: RouteLocation, item: Item): boolean => {
  if (item.to && isActiveLink(route, item.to)) return true

  if (item.items) return item.items.some(child => isActiveItem(route, child))

  if (item.name && route.meta.title) return item.name === route.meta.title

  return false
}

const AppSidebarNav = defineComponent({
  name: 'AppSidebarNav',
  components: {
    CNavItem,
    CNavGroup,
    CNavTitle,
  },
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  setup: function () {
    const route = useRoute()
    const firstRender = ref(true)

    const renderItem = (item: Item) => {
      if (item.items) {
        return h(
          CNavGroup,
          {
            ...(firstRender.value && {
              visible: item.items.some(child => isActiveItem(route, child)),
            }),
          },
          {
            togglerContent: () => [
              h(CIcon, {
                customClassName: 'nav-icon',
                name: item.icon,
              }),
              item.name,
            ],
            default: () => item.items && item.items.map(child => renderItem(child)),
          },
        )
      }

      return item.to
        ? h(
            RouterLink,
            {
              to: item.to,
              custom: true,
            },
            {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              default: (props: any) =>
                h(
                  resolveComponent(item.component),
                  {
                    active: props.isActive,
                    href: props.href,
                    onClick: () => props.navigate(),
                  },
                  () => [
                    item.icon &&
                      h(CIcon, {
                        customClassName: 'nav-icon',
                        name: item.icon,
                      }),
                    item.name,
                    item.badge &&
                      h(
                        CBadge,
                        {
                          class: 'ms-auto',
                          color: item.badge.color,
                        },
                        () => item.badge && item.badge.text,
                      ),
                  ],
                ),
            },
          )
        : h(resolveComponent(item.component), {}, () => item.name)
    }

    if (!isStaff.value) {
      ;(nav as any)[14].items.splice(0, 2)
      nav.splice(9, 4)
    } else if (!isCash.value) nav.splice(10, 1)

    return () =>
      h(
        CSidebarNav,
        {},
        {
          default: () => nav.map((item: Item) => renderItem(item)),
        },
      )
  },
})
export { AppSidebarNav }
