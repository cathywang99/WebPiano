import Vue from 'vue';
import Vuex from 'vuex';


Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    mainDoc: '', // 主文档
    hideNavBar: false, // 是否隐藏导航条
    cacheConf: {
      showKbdNum: true, // 显示键盘上的数字
      scale: 1, // 保存对barScale控制的参数，1-20
      barScale: 1, // 键盘可见区比例
      left: 0.5, // 0-1之间，表示键盘偏移数据
    },
  },

  mutations: {
    setData(state, data) {
      state.mainDoc = data && data.doc;
    },
  },

});