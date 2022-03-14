import api from '@/api'
import {
  FETCH_CONTRACT,
  FETCH_CONTRACT_LIST,
  FETCH_ORDER_GROUP_LIST,
  FETCH_SUBS_SUMMARY_LIST,
  FETCH_CONT_SUMMARY_LIST,
  FETCH_KEY_UNIT_LIST,
  FETCH_HOUSE_UNIT_LIST,
} from '@/store/modules/contract/mutations-types'
import router from '@/router'
import { message } from '@/utils/helper'

const actions = {
  fetchContractList: ({ commit }: any, payload?: any) => {
    const { project } = payload
    const status = payload.status ? payload.status : '2'
    let url = `/contract-custom-list/?project=${project}&activation=true&contractor__status=${status}`
    if (payload.order_group) url += `&order_group=${payload.order_group}`
    if (payload.unit_type) url += `&unit_type=${payload.unit_type}`
    if (payload.building)
      url += `&keyunit__houseunit__building_unit=${payload.building}`
    if (payload.registed) url += `&contractor__is_registed=${payload.registed}`
    if (payload.from_date) url += `&from_contract_date=${payload.from_date}`
    if (payload.to_date) url += `&to_contract_date=${payload.to_date}`
    if (payload.ordering) url += `&ordering=${payload.ordering}`
    if (payload.search) url += `&search=${payload.search}`
    const page = payload.page ? payload.page : 1
    url += `&page=${page}`
    api
      .get(url)
      .then(res => {
        commit(FETCH_CONTRACT_LIST, res.data)
      })
      .catch(err => console.log(err.response.data))
  },

  fetchContract: ({ commit }: any, pk: number) => {
    return api
      .get(`/contract-custom-list/${pk}/`)
      .then(res => {
        commit(FETCH_CONTRACT, res.data)
      })
      .catch(console.log)
  },

  createContract: async ({ dispatch }: any, payload: any) => {
    // 1. 계약 생성
    try {
      return await api.post(`/contract/`, payload)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },
  updateContract: async ({ dispatch }: any, payload: any) => {
    const { pk, ...formData } = payload
    try {
      return await api.put(`/contract/${pk}/`, formData)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  patchKeyUnit: async ({ dispatch }: any, payload: any) => {
    // 2. keyunit
    const { pk, ...data } = payload
    try {
      await api.patch(`key-unit/${pk}/`, data)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  patchHouseUnit: async ({ dispatch }: any, payload: any) => {
    // 3. houseunit
    const { pk, ...data } = payload
    try {
      await api.patch(`/house-unit/${pk}/`, data)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  createContractor: async ({ dispatch }: any, payload: any) => {
    // 4. contractor
    try {
      return await api.post(`/contractor/`, payload)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  updateContractor: async ({ dispatch }: any, payload: any) => {
    // 4. contractor
    const { pk, ...data } = payload
    try {
      return await api.put(`/contractor/${pk}/`, data)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  createAddress: async ({ dispatch }: any, payload: any) => {
    // 5. address
    try {
      await api.post(`/contractor-address/`, payload)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  updateAddress: async ({ dispatch }: any, payload: any) => {
    // 5. address
    const { pk, ...data } = payload
    try {
      await api.put(`/contractor-address/${pk}/`, data)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  createContact: async ({ dispatch }: any, payload: any) => {
    // 6. contact
    try {
      await api.post(`/contractor-contact/`, payload)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  updateContact: async ({ dispatch }: any, payload: any) => {
    // 6. contact
    const { pk, ...data } = payload
    try {
      await api.put(`/contractor-contact/${pk}/`, data)
    } catch (err: any) {
      console.log(err.response.data)
    }
  },

  createContractSet: async ({ dispatch }: any, payload: any) => {
    // 1. contract 생성
    const { project, order_group, unit_type, key_unit, ...rest1 } = payload
    const ordergroup = order_group.split(',')
    const keyunit = key_unit.split(',')
    const serial_number = `${keyunit[1]}-${ordergroup[0]}`
    const contractPayload = {
      project,
      order_group: ordergroup[0],
      unit_type,
      serial_number,
    }

    const contractObj = await dispatch('createContract', contractPayload)

    // 2. 계약 유닛 연결 ( keyunit -> contract.pk)
    const keyUnitPk = keyunit[0]
    const contPk = contractObj.data.pk
    const keyunitPayload = { pk: keyUnitPk, contract: contPk }

    await dispatch('patchKeyUnit', keyunitPayload)

    // 3. 동호수 연결
    const { houseunit, ...rest3 } = rest1
    const houseUnitPk = houseunit
    const houseUnitData = { pk: houseUnitPk, key_unit: keyUnitPk }

    if (houseunit) await dispatch('patchHouseUnit', houseUnitData)

    // 4. 계약자 정보 테이블 입력
    const {
      name,
      birth_date,
      gender,
      is_registed,
      status,
      reservation_date,
      contract_date,
      note,
      ...rest4
    } = rest3
    const contractorObj = await dispatch('createContractor', {
      contract: contPk,
      name,
      birth_date,
      gender,
      is_registed,
      status,
      reservation_date,
      contract_date,
      note,
    })

    // 5. 계약자 주소 테이블 입력
    const contractor = contractorObj.data.pk
    const {
      id_zipcode,
      id_address1,
      id_address2,
      id_address3,
      dm_zipcode,
      dm_address1,
      dm_address2,
      dm_address3,
      ...rest5
    } = rest4
    if (id_zipcode || dm_zipcode)
      await dispatch('createAddress', {
        contractor,
        id_zipcode,
        id_address1,
        id_address2,
        id_address3,
        dm_zipcode,
        dm_address1,
        dm_address2,
        dm_address3,
      })

    // 6. 계약자 연락처 테이블 입력
    const { cell_phone, home_phone, other_phone, email, ...rest6 } = rest5
    if (cell_phone)
      await dispatch('createContact', {
        contractor,
        cell_phone,
        home_phone,
        other_phone,
        email,
      })

    // 7. 계약금 - 수납 정보 테이블 입력
    const cashData = {
      project,
      sort: 1,
      project_account_d1: ordergroup[1],
      project_account_d2: ordergroup[1],
      is_contract_payment: true,
      contract: contPk,
      content: `${name}[${serial_number} 대금납부]`,
      ...rest6,
    }
    try {
      await api.post(`/project-cashbook/`, cashData)
    } catch (err: any) {
      console.log(err.response.data)
    }

    dispatch('fetchContractList', { project, status })
    message()
  },

  updateContractSet: async ({ dispatch }: any, payload: any) => {
    // 1. contract 업데이트
    const { pk, project, order_group, unit_type, key_unit, ...rest1 } = payload
    const ordergroup = order_group.split(',')
    const keyunit = key_unit.split(',')
    const serial_number = `${keyunit[1]}-${ordergroup[0]}`
    const contractPayload = {
      pk,
      project,
      order_group: ordergroup[0],
      unit_type,
      serial_number,
    }

    const contractObj = await dispatch('updateContract', contractPayload)

    // 2. 계약 유닛 연결 ( keyunit -> contract.pk)
    // --> 1) 종전 동호수 연결 해제
    // -----> 동호수가 연결되어 있는지 확인 -> true 면 실행

    const cont = await dispatch('fetchContract', contractObj.data.pk)

    console.log('--->', cont)
    // if (cont.keyunit.houseunit)
    //   await dispatch('patchHouseUnit', {
    //     pk: cont.keyunit.houseunit.pk,
    //     key_unit: null,
    //   })
    // // --> 2) 종전 계약 유닛 연결 해제
    // if (cont.keyunit)
    //   await dispatch('patchKeyUnit', { pk: cont.keyunit.pk, contract: null })
    //
    // // --> 3) 계약 유닛 재연결
    // const keyUnitPk = keyunit[0]
    // const contPk = contractObj.data.pk
    // const keyunitPayload = { pk: keyUnitPk, contract: contPk }
    // await dispatch('patchKeyUnit', keyunitPayload)
    //
    // // 3. 동호수 연결
    const { houseunit, ...rest3 } = rest1
    // const houseUnitData = { pk: houseunit, key_unit: keyunit[0] }
    // if (houseunit) await dispatch('patchHouseUnit', houseUnitData)

    // 4. 계약자 정보 테이블 입력
    const {
      contractorPk,
      name,
      birth_date,
      gender,
      is_registed,
      status,
      reservation_date,
      contract_date,
      note,
      ...rest4
    } = rest3
    const contractorObj = await dispatch('updateContractor', {
      pk: contractorPk,
      contract: contractObj.data.pk,
      name,
      birth_date,
      gender,
      is_registed,
      status,
      reservation_date,
      contract_date,
      note,
    })

    // 5. 계약자 주소 테이블 입력
    const contractor = contractorObj.data.pk
    const {
      addressPk,
      id_zipcode,
      id_address1,
      id_address2,
      id_address3,
      dm_zipcode,
      dm_address1,
      dm_address2,
      dm_address3,
      ...rest5
    } = rest4
    if (id_zipcode || dm_zipcode)
      await dispatch('updateAddress', {
        pk: addressPk,
        contractor,
        id_zipcode,
        id_address1,
        id_address2,
        id_address3,
        dm_zipcode,
        dm_address1,
        dm_address2,
        dm_address3,
      })

    // 6. 계약자 연락처 테이블 입력
    const { contactPk, cell_phone, home_phone, other_phone, email, ...rest6 } =
      rest5
    if (cell_phone)
      await dispatch('updateContact', {
        pk: contactPk,
        contractor,
        cell_phone,
        home_phone,
        other_phone,
        email,
      })

    // 7. 계약금 - 수납 정보 테이블 입력
    const { paymentPk, ...data } = rest6
    const cashData = {
      project,
      sort: 1,
      project_account_d1: ordergroup[1],
      project_account_d2: ordergroup[1],
      is_contract_payment: true,
      contract: contractObj.data.pk,
      content: `${name}[${serial_number} 대금납부]`,
      ...data,
    }
    if (cashData.deal_date) {
      if (!paymentPk) {
        try {
          await api.post(`/project-cashbook/`, cashData)
        } catch (err: any) {
          console.log(err.response.data)
        }
      } else {
        try {
          await api.put(`/project-cashbook/${paymentPk}/`, cashData)
        } catch (err: any) {
          console.log(err.response.data)
        }
      }
    }

    // dispatch('fetchContractList', { status })
    dispatch('fetchContract', contractObj.data.pk)
    message()
  },

  fetchSubsSummaryList: ({ commit }: any, project?: number) => {
    api
      .get(`/subs-sum/?project=${project}`)
      .then(res => {
        commit(FETCH_SUBS_SUMMARY_LIST, res.data)
      })
      .catch(err => console.log(err.response.data))
  },

  fetchContSummaryList: ({ commit }: any, project?: number) => {
    api
      .get(`/cont-sum/?project=${project}`)
      .then(res => {
        commit(FETCH_CONT_SUMMARY_LIST, res.data)
      })
      .catch(err => console.log(err.response.data))
  },

  fetchOrderGroupList: ({ commit }: any, pk?: number) => {
    api
      .get(`/order-group/?project=${pk}`)
      .then(res => {
        commit(FETCH_ORDER_GROUP_LIST, res.data)
      })
      .catch(err => console.log(err))
  },

  createOrderGroup: ({ dispatch }: any, payload: any) => {
    api
      .post(`/order-group/`, payload)
      .then(res => {
        dispatch('fetchOrderGroupList', res.data.project)
        message()
      })
      .catch(err => {
        console.log(err.response.data)
        alert(
          `${Object.keys(err.response.data)[0]} : ${
            err.response.data[Object.keys(err.response.data)[0]]
          }`,
        )
      })
  },

  updateOrderGroup: ({ dispatch }: any, payload: any) => {
    const { pk, ...formData } = payload
    api
      .put(`/order-group/${pk}/`, formData)
      .then(res => {
        dispatch('fetchOrderGroupList', res.data.project)
        message()
      })
      .catch(err => {
        console.log(err.response.data)
        alert(
          `${Object.keys(err.response.data)[0]} : ${
            err.response.data[Object.keys(err.response.data)[0]]
          }`,
        )
      })
  },

  deleteOrderGroup: ({ dispatch }: any, payload: any) => {
    const { pk, projId } = payload
    api
      .delete(`/order-group/${pk}/`)
      .then(() => {
        dispatch('fetchOrderGroupList', projId)
        message('danger', '알림!', '해당 오브젝트가 삭제되었습니다.')
      })
      .catch(err => {
        alert(
          '해당 그룹에 종속된 계약관련 데이터가 있는 경우 이 그룹을 삭제할 수 없습니다.',
        )
        ;(router as any).go()
      })
  },

  fetchKeyUnitList: ({ commit }: any, payload?: any) => {
    const { project } = payload
    const unit_type = payload.unit_type ? payload.unit_type : ''
    const contract = payload.contract ? payload.contract : ''
    const available = payload.available ? payload.available : 'true'
    api
      .get(
        `/key-unit/?project=${project}&unit_type=${unit_type}&contract=${contract}&available=${available}`,
      )
      .then(res => {
        commit(FETCH_KEY_UNIT_LIST, res.data)
      })
      .catch(err => console.log(err.response.data))
  },

  fetchHouseUnitList: ({ commit }: any, payload?: any) => {
    const { project } = payload
    const unit_type = payload.unit_type ? payload.unit_type : ''
    const contract = payload.contract ? payload.contract : ''
    const available = payload.available ? payload.available : 'true'
    api
      .get(
        `/house-unit/?project=${project}&unit_type=${unit_type}&contract=${contract}&is_hold=false&available=${available}`,
      )
      .then(res => {
        commit(FETCH_HOUSE_UNIT_LIST, res.data)
      })
      .catch(err => console.log(err.response.data))
  },
}

export default actions
