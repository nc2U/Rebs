import {
  FETCH_BUILDING_LIST,
  FETCH_FLOOR_TYPE_LIST,
  FETCH_PROJECT,
  FETCH_PROJECT_LIST,
  FETCH_TYPE_LIST,
} from '@/store/modules/project/mutations-types'
import { Project, ProjectState } from '@/store/modules/project/state'

const mutations = {
  [FETCH_PROJECT_LIST]: (state: ProjectState, payload: any) => {
    state.projectList = payload.results
  },

  [FETCH_PROJECT]: (state: ProjectState, payload: Project) => {
    state.project = payload
  },

  [FETCH_TYPE_LIST]: (state: ProjectState, payload: any) => {
    state.unitTypeList = payload.results
  },

  [FETCH_FLOOR_TYPE_LIST]: (state: ProjectState, payload: any) => {
    state.floorTypeList = payload.results
  },

  [FETCH_BUILDING_LIST]: (state: ProjectState, payload: any) => {
    state.bldgNumberList = payload.results
  },
}

export default mutations
