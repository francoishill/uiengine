import { createRoutes } from '../router'

const initialState = window.UIengine.state

const getters = {
  config: state => state.config,
  components: state => state.components,
  navigation: state => state.navigation,
  pages: state => state.pages,
  schema: state => state.schema,
  variants: state => state.variants
}

const mutations = {
  setState (state, uiengineState) {
    for (let property in uiengineState) {
      state[property] = uiengineState[property]
    }

    const { navigation } = uiengineState
    if (navigation) {
      createRoutes(navigation)
    }
  }
}

const actions = {
  // TODO: Replace this with applying updated state via websockets
  async fetchState ({ commit }) {
    const response = await window.fetch('/state.json')

    if (response.ok) {
      const data = await response.json()

      commit('setState', data)
    }

    return response
  }
}

export default {
  namespaced: true,
  state: initialState,
  getters,
  mutations,
  actions
}
