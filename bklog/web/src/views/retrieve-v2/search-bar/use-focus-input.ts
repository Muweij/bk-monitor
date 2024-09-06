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
import { ref, watch, onMounted, getCurrentInstance, onUnmounted } from 'vue';

import { getCharLength } from '@/common/util';

export default (props, formatModelValueItem: (val, index) => object) => {
  const modelValue = ref([]);
  const inputValue = ref('');
  const INPUT_MIN_WIDTH = 12;
  /**
   * 点击操作设置输入框位置
   * @param {*} index
   */
  const setFocusInputItem = (index = -1) => {
    const oldIndex = modelValue.value.findIndex(item => item?.is_focus_input);
    if (oldIndex === -1) {
      modelValue.value.push({ is_focus_input: true });
      return;
    }

    if (index >= 0) {
      if (oldIndex > index) {
        modelValue.value.splice(oldIndex, 1);
        modelValue.value.splice(index, 0, { is_focus_input: true });
      } else {
        modelValue.value.splice(index, 0, { is_focus_input: true });
        modelValue.value.splice(oldIndex, 1);
      }
    }
  };

  const setModelValue = val => {
    modelValue.value = (val ?? []).map(formatModelValueItem);
  };

  let instance = undefined;

  const getTargetInput = () => {
    const target = instance?.proxy?.$el;
    const input = target?.querySelector('.tag-option-focus-input');
    return input as HTMLInputElement;
  };

  const getRoot = () => {
    return instance?.proxy?.$el;
  };

  const handleContainerClick = e => {
    const root = getRoot();
    if (root !== undefined && root === e.target) {
      const input = root.querySelector('.tag-option-focus-input');
      input?.focus();
      input?.style.setProperty('width', `${1 * INPUT_MIN_WIDTH}px`);
      return input;
    }
  };

  const handleFulltextInput = e => {
    const input = getTargetInput();
    if (input !== undefined && e.target === input) {
      const value = input.value;
      const charLen = getCharLength(value);
      input.style.setProperty('width', `${charLen * INPUT_MIN_WIDTH}px`);
    }
  };

  const handleInputBlur = e => {
    const input = getTargetInput();
    if (input !== undefined && e.target === input) {
      input.value = '';
      input?.style.setProperty('width', `${1 * INPUT_MIN_WIDTH}px`);
    }
  };

  watch(
    props.value,
    val => {
      setModelValue(val);
      setFocusInputItem();
    },
    { deep: true, immediate: true },
  );

  onMounted(() => {
    instance = getCurrentInstance();

    document?.addEventListener('click', handleContainerClick);
    document?.addEventListener('input', handleFulltextInput);
  });

  onUnmounted(() => {
    document?.removeEventListener('click', handleContainerClick);
    document?.removeEventListener('input', handleFulltextInput);
  });

  return { modelValue, inputValue, handleContainerClick, handleInputBlur };
};
