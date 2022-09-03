import api from '@/api'
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { errorHandle, message } from '@/utils/helper'

export interface Site {
  pk: number
  project: number
  order: number
  district: string
  lot_number: string
  site_purpose: string
  official_area: string
  returned_area: string | null
  rights_restrictions: string
  dup_issue_date: string
  owners: SimpleOwner[]
}

type OwnSort = '개인' | '법인' | '국공유지'

interface SimpleOwner {
  pk: number
  owner: string
  own_sort_desc: OwnSort
}

export interface SiteOwner {
  pk: number | null
  project: number | null
  owner: string
  date_of_birth: string | null
  phone1: string
  phone2: string
  zipcode: string
  address1: string
  address2: string
  address3: string
  own_sort: string
  own_sort_desc: string
  sites: {
    pk: number
    site: number
    __str__: string
    ownership_ratio: string
    owned_area: string
    acquisition_date: string | null
  }[]
  counsel_record: string
}

export interface Relation {
  pk: number | null
  site: number | null
  site_owner: number | null
  ownership_ratio: string
  owned_area: string
  acquisition_date: null | string
}

export interface SiteContract {
  pk: number
  project: number
  owner: number
  owner_desc: SimpleOwner
  contract_date: string
  total_price: number
  contract_area: string | null
  down_pay1: number | null
  down_pay1_is_paid: boolean
  down_pay2: number | null
  down_pay2_is_paid: boolean
  inter_pay1: number | null
  inter_pay1_date: string | null
  inter_pay1_is_paid: boolean
  inter_pay2: number | null
  inter_pay2_date: string | null
  inter_pay2_is_paid: boolean
  remain_pay: number
  remain_pay_date: string | null
  remain_pay_is_paid: boolean
  ownership_completion: boolean
  acc_bank: string
  acc_number: string
  acc_owner: string
  note: string
}

interface AllSite {
  pk: number
  __str__: string
}

interface AllOwner {
  pk: number
  owner: string
}

export const useSite = defineStore('site', () => {
  const allSites = ref<AllSite[]>([])
  const getSites = computed(() =>
    allSites.value.map((s: AllSite) => ({
      value: s.pk,
      label: s.__str__,
    })),
  )
  const getSitesTotal = ref<{
    project: number
    official: number | null
    returned: number | null
  }>()

  const fetchAllSites = (project: number) => {
    api.get(`/all-site/?project=${project}`).then(res => {
      allSites.value = res.data.results
    })
  }

  const fetchSitesTotal = (project: number) => {
    api.get(`/sites-total/?project=${project}`).then(res => {
      getSitesTotal.value = res.data.results[0]
    })
  }

  const siteList = ref<Site[]>([])
  const getSiteList = computed(() =>
    siteList.value.map((s: Site) => ({
      pk: s.pk,
      project: s.project,
      order: s.order,
      district: s.district,
      lot_number: s.lot_number,
      site_purpose: s.site_purpose,
      official_area: s.official_area,
      returned_area: s.returned_area,
      rights_restrictions: s.rights_restrictions,
      dup_issue_date: s.dup_issue_date,
      owners: s.owners.map(o => o.owner),
    })),
  )
  const siteCount = ref(0)

  const fetchSiteList = (project: number, page = 1, search = '') => {
    api
      .get(`/site/?project=${project}&page=${page}&search=${search}`)
      .then(res => {
        siteList.value = res.data.results
        siteCount.value = res.data.count
        fetchSitesTotal(project)
      })
      .catch(err => errorHandle(err.response.data))
  }

  const createSite = (payload: Site & { page: number; search: string }) => {
    const { page, search, ...formData } = payload
    api
      .post(`/site/`, formData)
      .then(res => {
        fetchSiteList(res.data.project, page, search)
        message()
      })
      .catch(err => errorHandle(err.response.data))
  }

  const updateSite = (
    payload: { pk: number; page: number; search: string } & Site,
  ) => {
    const { pk, page, search, ...formData } = payload
    api
      .put(`/site/${pk}/`, formData)
      .then(res => {
        fetchSiteList(res.data.project, page, search)
        message()
      })
      .catch(err => errorHandle(err.response.data))
  }

  const deleteSite = (pk: number, project: number) => {
    api
      .delete(`/site/${pk}/`)
      .then(() => {
        fetchSiteList(project)
        message('warning', '', '해당 부지 정보가 삭제되었습니다.')
      })
      .catch(err => errorHandle(err.response.data))
  }

  const allOwners = ref<AllOwner[]>([])
  const getOwners = computed(() =>
    allOwners.value.map((o: AllOwner) => ({
      value: o.pk,
      label: o.owner,
    })),
  )
  const getOwnersTotal = ref<{
    project: number
    owned_area: number | null
  }>()

  const siteOwner = ref<SiteOwner | null>(null)
  const siteOwnerList = ref<SiteOwner[]>([])
  const siteOwnerCount = ref(0)

  const fetchOwnersTotal = (project: number) => {
    api.get(`/owners-total/?project=${project}`).then(res => {
      getOwnersTotal.value = res.data.results[0]
    })
  }

  const fetchAllOwners = (project: number) => {
    api.get(`/all-owner/?project=${project}`).then(res => {
      allOwners.value = res.data.results
    })
  }

  const fetchSiteOwner = (pk: number) => {
    api
      .get(`/site-owner/${pk}/`)
      .then(res => {
        siteOwner.value = res.data
      })
      .catch(err => errorHandle(err.response.data))
  }

  const fetchSiteOwnerList = (
    project: number,
    page = 1,
    own_sort = '',
    search = '',
  ) => {
    api
      .get(
        `/site-owner/?project=${project}&page=${page}&own_sort=${own_sort}&search=${search}`,
      )
      .then(res => {
        siteOwnerList.value = res.data.results
        siteOwnerCount.value = res.data.count
        fetchOwnersTotal(project)
      })
      .catch(err => errorHandle(err.response.data))
  }

  const createSiteOwner = (
    payload: SiteOwner & { page: number; own_sort: string; search: string },
  ) => {
    const { page, own_sort, search, ...formData } = payload
    api
      .post(`/site-owner/`, formData)
      .then(res => {
        fetchSiteOwnerList(res.data.project, page, own_sort, search)
        message()
        console.log('--->', res.data, res.data.sites)
      })
      .catch(err => errorHandle(err.response.data))
  }

  const updateSiteOwner = (
    payload: SiteOwner & { page: number; own_sort: string; search: string },
  ) => {
    const { pk, page, own_sort, search, ...formData } = payload
    api
      .put(`/site-owner/${pk}/`, formData)
      .then(res => {
        fetchSiteOwnerList(res.data.project, page, own_sort, search)
        message()
      })
      .catch(err => errorHandle(err.response.data))
  }

  const deleteSiteOwner = (pk: number, project: number) => {
    api
      .delete(`/site-owner/${pk}/`)
      .then(() => {
        fetchSiteOwnerList(project)
        message('warning', '', '해당 소유자 정보가 삭제되었습니다.')
      })
      .catch(err => errorHandle(err.response.data))
  }

  const relationList = ref<Relation[]>([])

  const patchRelation = (
    payload: Relation & {
      project: number
      page: number
      own_sort: string
      search: string
    },
  ) => {
    const { pk, project, page, own_sort, search, ...relationData } = payload
    api
      .patch(`/site-relation/${pk}/`, relationData)
      .then(() => {
        fetchSiteOwnerList(project, page, own_sort, search)
        message()
      })
      .catch(err => errorHandle(err.response.data))
  }

  const siteContList = ref<SiteContract[]>([])
  const siteContCount = ref(0)

  const fetchSiteContList = (
    project: number,
    page = 1,
    own_sort = '',
    search = '',
  ) => {
    api
      .get(
        `/site-contract/?project=${project}&page=${page}&own_sort=${own_sort}&search=${search}`,
      )
      .then(res => {
        siteContList.value = res.data.results
        siteContCount.value = res.data.count
      })
      .catch(err => errorHandle(err.response.data))
  }

  const createSiteCont = (payload: SiteContract) => {
    api
      .post(`/site-contract/`, payload)
      .then(res => {
        fetchSiteContList(res.data.project)
        message()
      })
      .catch(err => errorHandle(err.response.data))
  }

  const updateSiteCont = (payload: { pk: number } & SiteContract) => {
    const { pk, ...contData } = payload
    api
      .put(`/site-contract/${pk}/`, contData)
      .then(res => {
        fetchSiteContList(res.data.project)
        message()
      })
      .catch(err => errorHandle(err.response.data))
  }

  const deleteSiteCont = (pk: number, project: number) => {
    api
      .delete(`/site-contract/${pk}/`)
      .then(() => {
        fetchSiteContList(project)
        message('warning', '', '해당 부지 매입계약 정보가 삭제되었습니다.')
      })
      .catch(err => errorHandle(err.response.data))
  }

  return {
    allSites,
    getSites,
    getSitesTotal,
    siteList,
    getSiteList,
    siteCount,

    fetchAllSites,
    fetchSitesTotal,
    fetchSiteList,
    createSite,
    updateSite,
    deleteSite,

    getOwners,
    getOwnersTotal,
    siteOwner,
    siteOwnerList,
    siteOwnerCount,

    fetchAllOwners,
    fetchOwnersTotal,
    fetchSiteOwner,
    fetchSiteOwnerList,
    createSiteOwner,
    updateSiteOwner,
    deleteSiteOwner,

    relationList,

    patchRelation,

    siteContList,
    siteContCount,

    fetchSiteContList,
    createSiteCont,
    updateSiteCont,
    deleteSiteCont,
  }
})
