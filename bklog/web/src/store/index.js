/* eslint-disable @typescript-eslint/no-misused-promises */
/*
 * Tencent is pleased to support the open source community by making
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) available.
 *
 * Copyright (C) 2021 THL A29 Limited, a Tencent company.  All rights reserved.
 *
 * 蓝鲸智云PaaS平台 (BlueKing PaaS) is licensed under the MIT License.
 *
 * License for 蓝鲸智云PaaS平台 (BlueKing PaaS):
 *
 * ---------------------------------------------------
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
 * documentation files (the "Software"), to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
 * to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of
 * the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
 * THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF
 * CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
 * IN THE SOFTWARE.
 */

/**
 * @file main store
 * @author  <>
 */
import Vue from 'vue';

import {
  unifyObjectStyle,
  getOperatorKey,
  readBlobRespToJson,
  parseBigNumberList,
  setDefaultTableWidth,
  sessionShowFieldObj,
  formatDate,
} from '@/common/util';
import axios from 'axios';
import Vuex from 'vuex';

import collect from './collect';
import {
  IndexSetQueryResult,
  IndexFieldInfo,
  IndexItem,
  IndexsetItemParams,
  logSourceField,
  indexSetClusteringData,
} from './default-values.ts';
import globals from './globals';
import RequestPool from './request-pool';
import retrieve from './retrieve';
import http from '@/api';

Vue.use(Vuex);

const store = new Vuex.Store({
  // 模块
  modules: {
    retrieve,
    collect,
    globals,
  },
  // 公共 store
  state: {
    userMeta: {}, // /meta/mine
    pageLoading: true,
    authDialogData: null,
    // 是否将unix时间戳格式化
    isFormatDate: true,
    // 当前运行环境
    runVersion: '',
    // 系统当前登录用户
    user: {},
    // 是否作为iframe被嵌套
    asIframe: false,
    iframeQuery: {},
    // 当前项目及Id
    space: {},
    spaceUid: '',
    indexId: '',
    indexItem: { ...IndexItem },
    operatorDictionary: {},
    /** 联合查询ID列表 */
    unionIndexList: [],
    /** 联合查询元素列表 */
    unionIndexItemList: [],

    // 收藏列表
    favoriteList: [],

    /** 索引集对应的字段列表信息 */
    // @ts-ignore
    indexFieldInfo: { ...IndexFieldInfo },
    indexSetQueryResult: { ...IndexSetQueryResult },
    indexSetFieldConfig: { clustering_config: { ...indexSetClusteringData } },
    indexSetFieldConfigList: {
      is_loading: false,
      data: [],
    },
    indexSetOperatorConfig: {
      /** 当前日志来源是否展示  用于字段更新后还保持显示状态 */
      isShowSourceField: false,
    },
    traceIndexId: '',
    // 业务Id
    bkBizId: '',
    // 我的项目列表
    mySpaceList: [],
    currentMenu: {},
    currentMenuItem: {},
    topMenu: [],
    menuList: [],
    visibleFields: [],
    // 数据接入权限
    menuProject: [],
    errorPage: ['notTraceIndex'],
    // 全局配置
    globalsData: {},
    activeTopMenu: {},
    activeManageNav: {},
    activeManageSubNav: {},
    // -- id, id对应数据
    collectDetail: [0, {}],
    // 清除table表头宽度缓存
    clearTableWidth: 0,
    showRouterLeaveTip: false,
    // 新人指引
    userGuideData: {},
    curCustomReport: null,
    // demo 业务链接
    demoUid: '',
    spaceBgColor: '', // 空间颜色
    isEnLanguage: false,
    chartSizeNum: 0, // 自定义上报详情拖拽后 表格chart需要自适应新宽度
    isExternal: false, // 外部版
    /** 是否展示全局脱敏弹窗 */
    isShowGlobalDialog: false,
    /** 当前全局设置弹窗的活跃id */
    globalActiveLabel: 'masking-setting', // masking-setting
    /** 全局设置列表 */
    globalSettingList: [],
    /** 日志灰度 */
    maskingToggle: {
      toggleString: 'off',
      toggleList: [],
    },
    /** 外部版路由菜单 */
    externalMenu: [],
    isAppFirstLoad: true,
    /** 是否清空了显示字段，展示全量字段 */
    isNotVisibleFieldsShow: false,
    showAlert: false, // 是否展示跑马灯
    isLimitExpandView: false,
    storeIsShowClusterStep: false,
    retrieveDropdownData: {},
    notTextTypeFields: [],
    tableLineIsWarp: true,
    isSetDefaultTableColumn: false,
    tookTime: 0,
    showFieldAlias: localStorage.getItem('showFieldAlias') === 'true',
  },
  // 公共 getters
  getters: {
    runVersion: state => state.runVersion,
    user: state => state.user,
    space: state => state.space,
    spaceUid: state => state.spaceUid,
    indexId: state => state.indexId,
    visibleFields: state => state.visibleFields,
    /** 是否是联合查询 */
    isUnionSearch: state => !!state.unionIndexList.length,
    /** 联合查询索引集ID数组 */
    unionIndexList: state => state.unionIndexList,
    unionIndexItemList: state => state.unionIndexItemList,
    traceIndexId: state => state.traceIndexId,
    bkBizId: state => state.bkBizId,
    mySpaceList: state => state.mySpaceList,
    pageLoading: state => state.pageLoading,
    globalsData: state => state.globalsData,
    // -- 返回数据
    collectDetail: state => state.collectDetail[1],
    asIframe: state => state.asIframe,
    iframeQuery: state => state.iframeQuery,
    demoUid: state => state.demoUid,
    accessUserManage: state =>
      Boolean(
        state.topMenu
          .find(item => item.id === 'manage')
          ?.children.some(item => item.id === 'permissionGroup' && item.project_manage === true),
      ),
    spaceBgColor: state => state.spaceBgColor,
    isEnLanguage: state => state.isEnLanguage,
    chartSizeNum: state => state.chartSizeNum,
    isShowGlobalDialog: state => state.isShowGlobalDialog,
    globalActiveLabel: state => state.globalActiveLabel,
    globalSettingList: state => state.globalSettingList,
    maskingToggle: state => state.maskingToggle,
    isNotVisibleFieldsShow: state => state.isNotVisibleFieldsShow,
    /** 脱敏灰度判断 */
    isShowMaskingTemplate: state =>
      state.maskingToggle.toggleString === 'on' || state.maskingToggle.toggleList.includes(Number(state.bkBizId)),
    isLimitExpandView: state => state.isLimitExpandView,
    // @ts-ignore
    retrieveParams: state => {
      const {
        start_time,
        end_time,
        isUnionIndex,
        addition,
        begin,
        size,
        keyword = '*',
        ip_chooser,
        host_scopes,
        interval,
        ids,
      } = state.indexItem;

      return {
        start_time,
        end_time,
        isUnionIndex,
        addition,
        begin,
        size,
        keyword,
        ip_chooser,
        host_scopes,
        interval,
        ids,
      };
    },
    storeIsShowClusterStep: state => state.storeIsShowClusterStep,
  },
  // 公共 mutations
  mutations: {
    updateFavoriteList(state, payload) {
      state.favoriteList.length = 0;
      state.favoriteList = [];
      state.favoriteList.push(...(payload ?? []));
    },
    updateIndexItem(state, payload) {
      if (payload?.addition?.length >= 0) {
        state.indexItem.addition.splice(0, state.indexItem.addition.length, ...payload?.addition);
      }
      Object.assign(state.indexItem, payload ?? {});
      state.unionIndexList = [];
      if (payload.isUnionIndex) {
        state.unionIndexList = payload.ids;
      }
    },

    updateIndexSetOperatorConfig(state, payload) {
      Object.assign(state.indexSetOperatorConfig, payload ?? {});
    },

    /**
     * 当切换索引集时，重置请求参数默认值
     * @param {*} state
     * @param {*} payload
     */
    resetIndexsetItemParams(state, payload) {
      const defaultValue = { ...IndexsetItemParams };
      if (payload?.addition?.length >= 0) {
        state.indexItem.addition.splice(0, state.indexItem.addition.length, ...payload?.addition);
      }
      Object.assign(state.indexItem, defaultValue, payload ?? {});
    },

    updateIndexSetFieldConfig(state, payload) {
      const defVal = { ...indexSetClusteringData };
      const { config } = payload ?? { config: [] };
      const result = (config ?? []).reduce((output, item) => Object.assign(output, { [item.name]: { ...item } }), {
        clustering_config: defVal,
      });

      Object.assign(state.indexSetFieldConfig, result ?? {});
    },

    resetIndexSetQueryResult(state, payload) {
      Object.assign(state.indexSetQueryResult, IndexSetQueryResult, payload ?? {});
    },

    updateIndexSetQueryResult(state, payload) {
      Object.assign(state.indexSetQueryResult, payload ?? {});
    },

    updateIndexItemParams(state, payload) {
      if (payload?.addition?.length >= 0) {
        state.indexItem.addition.splice(0, state.indexItem.addition.length, ...payload?.addition);
      }
      Object.assign(state.indexItem, payload ?? {});
    },

    updateIndexSetFieldConfigList() {
      if (payload.is_loading !== undefined) {
        state.indexSetFieldConfigList.is_loading = payload.is_loading;
      }

      if (payload.data) {
        state.indexSetFieldConfigList.data.length = 0;
        state.indexSetFieldConfigList.data.push(...(payload ?? []));
      }
    },

    updataOperatorDictionary(state, payload) {
      state.operatorDictionary = {};
      (payload.fields ?? []).forEach(field => {
        const { field_operator = [] } = field;
        field_operator.forEach(item => {
          const { operator } = item;
          const key = getOperatorKey(operator);
          Object.assign(state.operatorDictionary, { [key]: item });
        });
      });
    },

    updateUserMeta(state, payload) {
      state.userMeta = payload;
    },
    /**
     * 设置初始化 loading 是否显示
     */
    setPageLoading(state, loading) {
      state.pageLoading = loading;
    },
    updateAuthDialogData(state, payload) {
      state.authDialogData = payload;
    },
    updateIsFormatDate(state, payload) {
      state.isFormatDate = payload;
    },
    /**
     * 更新当前运行环境
     * @param {Object} state store state
     * @param {String} runVersion 运行环境
     */
    updateRunVersion(state, runVersion) {
      state.runVersion = runVersion;
    },
    /**
     * 更新当前用户 user
     *
     * @param {Object} state store state
     * @param {Object} user user 对象
     */
    updateUser(state, user) {
      state.user = Object.assign({}, user);
    },
    /**
     * 更新当前路由对应导航
     */
    updateCurrentMenu(state, current) {
      Vue.set(state, 'currentMenu', current);
    },
    updateCurrentMenuItem(state, item) {
      Vue.set(state, 'currentMenuItem', item);
    },
    updateSpace(state, spaceUid) {
      state.space = state.mySpaceList.find(item => item.space_uid === spaceUid) || {};
      state.spaceUid = spaceUid;
      state.bkBizId = state.space.bk_biz_id;
    },
    updateMySpaceList(state, spaceList) {
      state.mySpaceList = spaceList.map(item => {
        const defaultTag = { id: item.space_type_id, name: item.space_type_name, type: item.space_type_id };
        return {
          ...item,
          name: item.space_name.replace(/\[.*?\]/, ''),
          py_text: Vue.prototype.$bkToPinyin(item.space_name, true),
          tags:
            item.space_type_id === 'bkci' && item.space_code
              ? [defaultTag, { id: 'bcs', name: window.mainComponent.$t('容器项目'), type: 'bcs' }]
              : [defaultTag],
        };
      });
    },
    updateIndexId(state, indexId) {
      state.indexId = indexId;
    },
    updateUnionIndexList(state, unionIndexList) {
      state.unionIndexList = unionIndexList;
      state.indexItem.ids = unionIndexList;
    },
    updateUnionIndexItemList(state, unionIndexItemList) {
      state.unionIndexItemList = unionIndexItemList;
    },
    updateTraceIndexId(state, indexId) {
      state.traceIndexId = indexId;
    },
    updateMenuList(state, menuList) {
      state.menuList.splice(0, state.menuList.length, ...menuList);
    },
    updateActiveTopMenu(state, payload) {
      state.activeTopMenu = payload;
    },
    updateActiveManageNav(state, payload) {
      state.activeManageNav = payload;
    },
    updateActiveManageSubNav(state, payload) {
      state.activeManageSubNav = payload;
    },
    updateMenuProject(state, menuProject) {
      state.menuProject.splice(0, state.menuProject.length, ...menuProject);
    },
    updateTopMenu(state, topMenu) {
      state.topMenu.splice(0, state.topMenu.length, ...topMenu);
    },
    updateGlobalsData(state, globalsData) {
      state.globalsData = globalsData;
      Vue.set(state, 'globalsData', globalsData);
    },
    // -- 代码调整 collectDetail: [id, 数据]
    updateCollectDetail(state, collectDetail) {
      const data = collectDetail[1];
      data.params.paths = data.params.paths.map(item => ({ value: item }));
      state.collectDetail = data;
    },
    updateAsIframe(state, asIframe) {
      state.asIframe = asIframe;
    },
    updateIframeQuery(state, iframeQuery) {
      Object.assign(state.iframeQuery, iframeQuery);
    },
    updateClearTableWidth(state, clearTableWidth) {
      state.clearTableWidth += clearTableWidth;
    },
    updateRouterLeaveTip(state, isShow) {
      state.showRouterLeaveTip = isShow;
    },
    setUserGuideData(state, userGuideData) {
      state.userGuideData = userGuideData;
    },
    setDemoUid(state, demoUid) {
      state.demoUid = demoUid;
    },
    setSpaceBgColor(state, val) {
      state.spaceBgColor = val;
    },
    updateIsEnLanguage(state, val) {
      state.isEnLanguage = val;
    },
    updateChartSize(state) {
      state.chartSizeNum += 1;
    },
    updateIsShowGlobalDialog(state, val) {
      state.isShowGlobalDialog = val;
    },
    updateGlobalActiveLabel(state, val) {
      state.globalActiveLabel = val;
    },
    updateGlobalSettingList(state, val) {
      state.globalSettingList = val;
    },
    updateMaskingToggle(state, val) {
      state.maskingToggle = val;
    },
    updateExternalMenu(state, val) {
      state.externalMenu = val;
    },
    updateVisibleFields(state, val) {
      state.visibleFields = val;
    },
    updateIsNotVisibleFieldsShow(state, val) {
      state.isNotVisibleFieldsShow = val;
    },
    updateNoticeAlert(state, val) {
      state.showAlert = val;
    },
    updateIsLimitExpandView(state, val) {
      localStorage.setItem('EXPAND_SEARCH_VIEW', JSON.stringify(val));
      state.isLimitExpandView = val;
    },
    updateIndexFieldInfo(state, payload) {
      Object.assign(state.indexFieldInfo, payload ?? {});
    },
    resetIndexFieldInfo(state, payload) {
      const defValue = { ...IndexFieldInfo };
      state.indexFieldInfo = Object.assign(defValue, payload ?? {});
    },
    updateStoreIsShowClusterStep(state, val) {
      state.storeIsShowClusterStep = val;
    },
    updateSqlQueryFieldList(state, payload) {
      const recursiveIncreaseData = (dataItem, prefixFieldKey = '') => {
        dataItem &&
          Object.entries(dataItem).forEach(([field, value]) => {
            if (typeof value === 'object') {
              recursiveIncreaseData(value, `${prefixFieldKey + field}.`);
            } else {
              const fullFieldKey = prefixFieldKey ? prefixFieldKey + field : field;
              let fieldData = state.retrieveDropdownData[fullFieldKey];
              if (fieldData) fieldData.__totalCount += 1;
              if (value || value === 0) {
                if (!fieldData) {
                  Object.assign(state.retrieveDropdownData, {
                    [fullFieldKey]: Object.defineProperties(
                      {},
                      {
                        __fieldType: {
                          // 该字段下的值的数据类型，可能是数值、字符串、布尔值
                          value: typeof value,
                        },
                        __totalCount: {
                          // 总记录数量
                          value: 1,
                          writable: true,
                        },
                        __validCount: {
                          // 有效值数量
                          value: 0,
                          writable: true,
                        },
                      },
                    ),
                  });
                  fieldData = state.retrieveDropdownData[fullFieldKey];
                }
                fieldData.__validCount += 1;
                fieldData[value] += 1;
                if (state.notTextTypeFields.includes(field) && !fieldData?.[value]) {
                  // 非 text 类型字段统计可选值，text 则由用户手动输入
                  fieldData[value] = 1;
                }
              }
            }
          });
      };

      // 更新下拉字段可选值信息
      const computeRetrieveDropdownData = listData => {
        listData.forEach(dataItem => {
          recursiveIncreaseData(dataItem);
        });
      };

      computeRetrieveDropdownData(payload ?? []);
    },
    updateNotTextTypeFields(state, payload) {
      state.notTextTypeFields.length = [];
      state.notTextTypeFields = [];

      state.notTextTypeFields.push(
        ...(payload.fields ?? []).filter(field => field.field_type !== 'text').map(item => item.field_name),
      );
    },
    updateTableLineIsWarp(state, payload) {
      state.tableLineIsWarp = payload;
    },
    updateShowFieldAlias(state, payload) {
      window.localStorage.setItem('showFieldAlias', payload);
      state.showFieldAlias = payload;
    },
    /** 初始化表格宽度 为false的时候会按照初始化的情况来更新宽度 */
    updateIsSetDefaultTableColumn(state, payload) {
      // 如果浏览器记录过当前索引集表格拖动过 则不需要重新计算
      if (!state.isSetDefaultTableColumn) {
        const storageKey = state.isUnionSearch ? 'TABLE_UNION_COLUMN_WIDTH' : 'table_column_width_obj';
        const columnWidth = JSON.parse(localStorage.getItem(storageKey));
        const indexKey = state.isUnionSearch ? state.unionIndexList.sort().join('-') : state.indexId;
        const catchFieldsWidthObj = columnWidth?.[state.bkBizId]?.fields[indexKey];
        state.isSetDefaultTableColumn = setDefaultTableWidth(
          state.visibleFields,
          state.indexSetQueryResult.list,
          catchFieldsWidthObj,
        );
      }
      if (typeof payload === 'boolean') state.isSetDefaultTableColumn = payload;
    },
    resetVisibleFields(state, payload) {
      const sessionShownFieldList = sessionShowFieldObj()?.[state.indexId];
      // 请求字段时 判断当前索引集是否有更改过字段 若更改过字段则使用session缓存的字段显示
      const filterList = (payload || sessionShownFieldList) ?? state.indexFieldInfo.display_fields;
      const visibleFields =
        filterList
          .map(displayName => {
            for (const field of state.indexFieldInfo.fields) {
              if (field.field_name === displayName) {
                return field;
              }
            }
          })
          .filter(Boolean) ?? [];
      store.commit('updateVisibleFields', visibleFields);
      store.commit('updateIsNotVisibleFieldsShow', !visibleFields.length);
    },
    resetIndexSetOperatorConfig(state) {
      const {
        bkmonitor,
        context_and_realtime: contextAndRealtime,
        bcs_web_console: bcsWebConsole,
      } = state.indexSetFieldConfig;
      // 字段设置的参数传到实时日志和上下文
      let indexSetValue;
      if (!state.indexItem.isUnionIndex) {
        const items = state.indexItem.items[0];
        indexSetValue = {
          scenarioID: items.scenario_id,
          sortFields: items.sort_fields ?? [],
          targetFields: items.target_fields ?? [],
        };
      } else {
        indexSetValue = {};
      }
      store.commit('updateIndexSetOperatorConfig', {
        bkmonitor,
        bcsWebConsole,
        contextAndRealtime,
        indexSetValue,
        toolMessage: {
          webConsole: bcsWebConsole.is_active ? 'WebConsole' : bcsWebConsole?.extra?.reason,
          realTimeLog: contextAndRealtime.is_active
            ? window.mainComponent.$t('实时日志')
            : contextAndRealtime?.extra?.reason,
          contextLog: contextAndRealtime.is_active
            ? window.mainComponent.$t('上下文')
            : contextAndRealtime?.extra?.reason,
        },
      });
    },
  },
  actions: {
    /**
     * 获取用户信息
     *
     * @param {Function} commit store commit mutation handler
     * @param {Object} state store state
     * @param {Function} dispatch store dispatch action handler
     * @param {Object} params 请求参数
     * @param {Object} config 请求的配置
     *
     * @return {Promise} promise 对象
     */
    userInfo({ commit }, params, config = {}) {
      return http.request('userInfo/getUserInfo', { query: params, config }).then(response => {
        const userData = response.data || {};
        commit('updateUser', userData);
        return userData;
      });
    },

    /**
     * 获取菜单列表
     *
     * @param {Function} commit store commit mutation handler
     * @param {Object} state store state
     * @param {Function} dispatch store dispatch action handler
     * @param {Object} params 请求参数
     * @param {Object} config 请求的配置
     *
     * @return {Promise} promise 对象
     */
    getMenuList({}, spaceUid) {
      return http.request('meta/menu', {
        query: {
          space_uid: spaceUid,
        },
      });
    },
    getGlobalsData({ commit }) {
      return http.request('collect/globals', { query: {} }).then(response => {
        const globalsData = response.data || {};
        commit('updateGlobalsData', globalsData);
        return globalsData;
      });
    },
    // -- 代码调整
    getCollectDetail({ commit, state }, data) {
      // 判断是否有该id的缓存数据
      if (state.collectDetail[0] !== data.collector_config_id) {
        commit('updateCollectDetail', [data.collector_config_id, data || {}]);
        return data;
      }
    },
    // 判断有无权限
    checkAllowed(context, paramData) {
      return new Promise(async (resolve, reject) => {
        try {
          const checkRes = await http.request('auth/checkAllowed', {
            data: paramData,
          });
          for (const item of checkRes.data) {
            if (item.is_allowed === false) {
              // 无权限
              resolve({
                isAllowed: false,
              });
              return;
            }
          }
          // 有权限
          resolve({
            isAllowed: true,
          });
        } catch (err) {
          // 请求出错
          reject(err);
        }
      });
    },
    // 已知无权限，需要获取信息
    getApplyData(context, paramData) {
      return http.request('auth/getApplyData', {
        data: paramData,
      });
    },
    // 判断有无权限，无权限获取相关信息
    checkAndGetData(context, paramData) {
      return new Promise(async (resolve, reject) => {
        try {
          const checkRes = await http.request('auth/checkAllowed', {
            data: paramData,
          });
          for (const item of checkRes.data) {
            if (item.is_allowed === false) {
              // 无权限
              const applyDataRes = await http.request('auth/getApplyData', {
                data: paramData,
              });
              resolve({
                isAllowed: false,
                data: applyDataRes.data,
              });
              return;
            }
          }
          // 有权限
          resolve({
            isAllowed: true,
          });
        } catch (err) {
          // 请求出错
          reject(err);
        }
      });
    },

    /**
     * 初始化时，通过路由参数和请求返回的索引集列表初始化索引集默认选中值
     * @param {*} param0
     * @param {*} param1
     */
    updateIndexItemByRoute({ commit }, { route, list }) {
      const ids = [];
      let isUnionIndex = false;
      commit('resetIndexSetQueryResult', { search_count: 0 });

      if (route.params.indexId) {
        ids.push(route.params.indexId);
        commit('updateIndexId', route.params.indexId);
      }

      if ((route.query?.unionList?.length ?? 0) > 0) {
        isUnionIndex = true;
        ids.push(...JSON.parse(decodeURIComponent(route.query?.unionList ?? '[]')));
      }

      if (!isUnionIndex && !ids.length && list?.length) {
        commit('updateIndexId', list[0].index_set_id);
        ids.push(list[0].index_set_id);
      }

      if (ids.length) {
        const payload = {
          ids,
          selectIsUnionSearch: isUnionIndex,
          items: ids.map(val => (list || []).find(item => item.index_set_id === val)),
          isUnionIndex,
        };

        commit('updateIndexItem', payload);
      }
    },

    requestIndexSetFieldInfo({ commit, dispatch, state }) {
      // @ts-ignore
      const { ids = [], start_time = '', end_time = '', isUnionIndex } = state.indexItem;

      if (!ids.length) {
        return;
      }

      commit('resetIndexFieldInfo', { is_loading: true });
      commit('updataOperatorDictionary', {});
      commit('updateVisibleFields', []);

      const urlStr = isUnionIndex ? 'unionSearch/unionMapping' : 'retrieve/getLogTableHead';

      const queryData = {
        start_time,
        end_time,
        is_realtime: 'True',
      };
      if (isUnionIndex) {
        Object.assign(queryData, {
          index_set_ids: ids,
        });
      }

      return http
        .request(urlStr, {
          params: { index_set_id: ids[0] },
          query: !isUnionIndex ? queryData : undefined,
          data: isUnionIndex ? queryData : undefined,
        })
        .then(res => {
          commit('updateIndexFieldInfo', res.data ?? {});
          commit('updataOperatorDictionary', res.data ?? {});
          commit('updateNotTextTypeFields', res.data ?? {});
          commit('updateIndexSetFieldConfig', res.data ?? {});
          commit('retrieve/updateFiledSettingConfigID', res.data?.config_id ?? -1); // 当前字段配置configID
          commit('resetVisibleFields');
          commit('resetIndexSetOperatorConfig');

          // 请求字段联想相关配置
          dispatch('requestIndexSetValueList');

          return res;
        })
        .catch(() => {
          commit('updateIndexFieldInfo', { is_loading: false });
        })
        .finally(() => {
          commit('updateIndexFieldInfo', { is_loading: false });
        });
    },

    /**
     * 执行查询
     */
    requestIndexSetQuery(
      { commit, state },
      payload = { isPagination: false, cancelToken: null, searchCount: undefined },
    ) {
      const {
        start_time,
        end_time,
        isUnionIndex,
        addition,
        size,
        keyword = '*',
        ip_chooser,
        host_scopes,
        interval,
        timezone,
        search_mode,
        sort_list,
      } = state.indexItem;
      let begin = state.indexItem.begin;
      const bk_biz_id = state.bkBizId;
      const searchCount = payload.searchCount ?? state.indexSetQueryResult.search_count + 1;
      commit(payload.isPagination ? 'updateIndexSetQueryResult' : 'resetIndexSetQueryResult', {
        is_loading: true,
        search_count: searchCount,
      });

      const baseUrl = process.env.NODE_ENV === 'development' ? 'api/v1' : window.AJAX_URL_PREFIX;
      const cancelTokenKey = 'requestIndexSetQueryCancelToken';
      RequestPool.execCanceToken(cancelTokenKey);
      const requestCancelToken = payload.cancelToken ?? RequestPool.getCancelToken(cancelTokenKey);

      // 区分联合查询和单选查询
      const searchUrl = !isUnionIndex
        ? `/search/index_set/${state.indexId}/search/`
        : '/search/index_set/union_search/';

      const baseData = {
        addition: (addition ?? []).filter(item => !item.disabled),
        // begin,
        bk_biz_id,
        end_time,
        host_scopes,
        interval,
        ip_chooser,
        keyword: keyword.length ? keyword : '*',
        size,
        start_time,
        timezone,
        search_mode,
        sort_list,
      };

      // 更新联合查询的begin
      const unionConfigs = state.unionIndexList.map(item => ({
        begin: payload.isPagination
          ? (state.indexItem.catchUnionBeginList.find(cItem => String(cItem?.index_set_id) === item)?.begin ?? 0)
          : 0,
        index_set_id: item,
      }));

      const queryBegin = payload.isPagination ? (begin += size) : 0;

      const queryData = Object.assign(
        baseData,
        !state.isUnionSearch
          ? {
              begin: queryBegin, // 单选检索的begin
            }
          : {
              union_configs: unionConfigs,
            },
      );
      const params = {
        method: 'post',
        url: searchUrl,
        cancelToken: requestCancelToken,
        withCredentials: true,
        baseURL: baseUrl,
        responseType: 'blob',
        data: queryData,
      };
      if (state.isExternal) {
        params.headers = {
          'X-Bk-Space-Uid': state.spaceUid,
        };
      }

      return axios(params)
        .then(resp => {
          if (resp.data && !resp.message) {
            return readBlobRespToJson(resp.data).then(({ code, data, result, message }) => {
              const rsolvedData = data;
              const indexSetQueryResult = state.indexSetQueryResult;
              const logList = parseBigNumberList(rsolvedData.list);
              const originLogList = parseBigNumberList(rsolvedData.origin_log_list);
              rsolvedData.list = payload.isPagination ? indexSetQueryResult.list.concat(logList) : logList;
              rsolvedData.origin_log_list = payload.isPagination
                ? indexSetQueryResult.origin_log_list.concat(originLogList)
                : originLogList;
              const catchUnionBeginList = parseBigNumberList(rsolvedData?.union_configs || []);
              state.tookTime = payload.isPagination
                ? state.tookTime + Number(data?.took || 0)
                : Number(data?.took || 0);
              // 更新页数
              commit('updateIndexItem', { begin: payload.isPagination ? begin : 0 });
              commit('updateSqlQueryFieldList', rsolvedData.list);
              commit('updateIndexItem', { catchUnionBeginList });
              commit('updateIndexSetQueryResult', rsolvedData);
              commit('updateIsSetDefaultTableColumn');

              return {
                data: rsolvedData,
                message,
                code,
                result,
              };
            });
          }

          return { data, message, result: false };
        })
        .catch(() => {
          commit('updateSqlQueryFieldList', []);
          commit('updateIndexSetQueryResult', []);
        })
        .finally(() => {
          commit('updateIndexSetQueryResult', { is_loading: false });
        });
    },

    requestFieldConfigList({ state, commit }, payload) {
      const cancelTokenKey = 'requestFieldConfigCancelToken';
      RequestPool.execCanceToken(cancelTokenKey);
      const requestCancelToken = payload.cancelToken ?? RequestPool.getCancelToken(cancelTokenKey);
      commit('updateIndexSetFieldConfigList', {
        data: [],
        is_loading: true,
      });
      return http
        .request(
          'retrieve/getFieldsListConfig',
          {
            data: {
              ...(state.isUnionSearch ? { index_set_ids: state.unionIndexList } : { index_set_id: state.indexId }),
              scope: 'default',
              index_set_type: state.isUnionSearch ? 'union' : 'single',
            },
          },
          {
            cancelToken: requestCancelToken,
          },
        )
        .then(resp => {
          commit('updateIndexSetFieldConfigList', {
            data: resp.data ?? [],
          });
        })
        .finally(() => {
          commit('updateIndexSetFieldConfigList', {
            is_loading: false,
          });
        });
    },

    /**
     * 索引集选择改变事件
     * 更新索引集相关缓存 & 发起当前索引集所需字段信息请求
     * @param {*} param0
     * @param {*} payload
     */
    requestIndexSetItemChanged({ commit, dispatch }, payload) {
      commit('updateIndexItem', payload);
      commit('resetIndexSetQueryResult', { search_count: 0, is_loading: true });
      commit('updateIsSetDefaultTableColumn', false);

      if (!payload.isUnionIndex) {
        commit('updateIndexId', payload.ids[0]);
      }

      return dispatch('requestIndexSetFieldInfo');
    },

    requestIndexSetValueList({ commit, state }, payload) {
      const filterFn = field => field.field_type !== 'text' && field.es_doc_values;
      const mapFn = field => field.field_name;
      const fields = payload?.fields?.length ? payload.fields : state.indexFieldInfo.fields.filter(filterFn).map(mapFn);
      commit('updateIndexFieldInfo', { aggs_items: [] });
      if (!fields.length) return;

      const { start_time, end_time } = state.indexItem;
      const urlStr = state.isUnionSearch ? 'unionSearch/unionTerms' : 'retrieve/getAggsTerms';
      const queryData = {
        keyword: '*',
        fields,
        start_time: formatDate(start_time * 1000),
        end_time: formatDate(end_time * 1000),
      };

      if (state.isUnionSearch) {
        Object.assign(queryData, {
          index_set_ids: state.unionIndexList,
        });
      }

      const params = {
        index_set_id: state.indexId,
      };

      const body = {
        params,
        data: queryData,
      };

      http.request(urlStr, body).then(resp => {
        commit('updateIndexFieldInfo', { aggs_items: resp.data.aggs_items });
      });
    },

    requestFavoriteList({ commit, state }, payload) {
      commit('updateFavoriteList', []);
      http
        .request('favorite/getFavoriteByGroupList', {
          query: {
            space_uid: payload?.spaceUid ?? state.spaceUid,
            order_type: payload?.sort ?? (localStorage.getItem('favoriteSortType') || 'NAME_ASC'),
          },
        })
        .then(resp => {
          commit('updateFavoriteList', resp.data || []);
          return resp;
        });
    },

    /**
     * 下钻添加条件到查询搜索
     * @param {*} param0
     * @param {*} payload
     * @returns
     */
    setQueryCondition({ state, dispatch }, payload) {
      const { field, operator, value, isLink = false } = payload;
      const getFieldType = field => {
        const target = state.indexFieldInfo.fields?.find(item => item.field_name === field);
        return target ? target.field_type : '';
      };

      const getAdditionMappingOperator = ({ operator, field }) => {
        let mappingKey = {
          // is is not 值映射
          is: '=',
          'is not': '!=',
        };

        /** text类型字段类型的下钻映射 */
        const textMappingKey = {
          is: 'contains match phrase',
          'is not': 'not contains match phrase',
        };

        const textType = getFieldType(field);
        switch (textType) {
          case 'text':
            mappingKey = textMappingKey;
            break;
          default:
            break;
        }
        return mappingKey[operator] ?? operator; // is is not 值映射
      };

      const getSqlAdditionMappingOperator = ({ operator, field }) => {
        let mappingKey = {
          // is is not 值映射
          is: ':',
          'is not': '!=',
        };

        /** text类型字段类型的下钻映射 */
        const textMappingKey = {
          is: ':',
          'is not': 'not contains match phrase',
        };

        const textType = getFieldType(field);
        switch (textType) {
          case 'text':
            mappingKey = textMappingKey;
            break;
          default:
            break;
        }
        return mappingKey[operator] ?? operator; // is is not 值映射
      };

      /** 判断条件是否已经在检索内 */
      const additionIsExist = ({ field, value }) => {
        const mapOperator = getAdditionMappingOperator({ field, value });
        const isExist = state.indexItem.addition.some(addition => {
          return (
            addition.field === field &&
            addition.operator === mapOperator &&
            addition.value.toString() === value.toString()
          );
        });
        return isExist;
      };

      const isExist = additionIsExist({ field, operator, value });
      // 已存在相同条件
      if (isExist) {
        return;
      }
      const mapOperator = getAdditionMappingOperator({ field, operator });
      const startIndex = state.indexItem.addition.length;
      const newAddition = { field, operator: mapOperator, value };
      if (!isLink) {
        if (state.indexItem.search_mode === 'ui') {
          state.indexItem.addition.splice(startIndex, 0, newAddition);
          dispatch('requestIndexSetQuery');
        }

        if (state.indexItem.search_mode === 'sql') {
          const sqlMapOperator = getSqlAdditionMappingOperator({ field, operator });

          const keyword = state.indexItem.keyword.replace(/^\s*\*\s*$/, '');
          const valString = /^-?\d+\.?\d*$/.test(value) ? value : `"${value}"`;
          const appendText = `${field} ${sqlMapOperator} ${valString}`;
          if (keyword.indexOf(appendText) === -1) {
            const keywords = keyword.length > 0 ? [keyword] : [];
            keywords.push(appendText);
            state.indexItem.keyword = keywords.join(' and ');
            dispatch('requestIndexSetQuery');
          }
        }
      }

      return Promise.resolve(newAddition);
    },

    changeShowUnionSource({ commit, dispatch, state }) {
      commit('updateIndexSetOperatorConfig', { isShowSourceField: !state.indexSetOperatorConfig.isShowSourceField });
      dispatch('showShowUnionSource', { keepLastTime: false });
    },

    /** 日志来源显隐操作 */
    showShowUnionSource({ state }, { keepLastTime = false }) {
      // 非联合查询 或者清空了所有字段 不走逻辑
      if (!state.isUnionSearch || !state.visibleFields.length) return;
      const isExist = state.visibleFields.some(item => item.tag === 'union-source');
      // 保持之前的逻辑
      if (keepLastTime) {
        const isShowSourceField = state.indexSetOperatorConfig.isShowSourceField;
        if (isExist) {
          !isShowSourceField && state.visibleFields.shift();
        } else {
          isShowSourceField && state.visibleFields.unshift(logSourceField());
        }
        return;
      }

      isExist ? state.visibleFields.shift() : state.visibleFields.unshift(logSourceField());
    },
  },
});

/**
 * hack vuex dispatch, add third parameter `config` to the dispatch method
 *
 * 需要对单独的请求做配置的话，无论是 get 还是 post，store.dispatch 都需要三个参数，例如：
 * store.dispatch('example/btn1', {btn: 'btn1'}, {fromCache: true})
 * 其中第二个参数指的是请求本身的参数，第三个参数指的是请求的配置，如果请求本身没有参数，那么
 * 第二个参数也必须占位，store.dispatch('example/btn1', {}, {fromCache: true})
 * 在 store 中需要如下写法：
 * btn1 ({ commit, state, dispatch }, params, config) {
 *     return http.get(`/app/index?invoke=btn1`, params, config)
 * }
 *
 * @param {Object|string} _type vuex type
 * @param {Object} _payload vuex payload
 * @param {Object} config config 参数，主要指 http 的参数，详见 src/api/index initConfig
 *
 * @return {Promise} 执行请求的 promise
 */
store.dispatch = function (_type, _payload, config = {}) {
  const { type, payload } = unifyObjectStyle(_type, _payload);

  const action = { type, payload, config };
  const entry = store._actions[type];
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] unknown action type: ${type}`);
    }
    return;
  }

  store._actionSubscribers
    .slice()
    .filter(sub => sub.before)
    .forEach(sub => sub.before(action, store.state));
  // store._actionSubscribers.forEach(sub => sub(action, store.state));

  return entry.length > 1 ? Promise.all(entry.map(handler => handler(payload, config))) : entry[0](payload, config);
};

export default store;
