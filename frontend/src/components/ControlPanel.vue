<script setup lang="ts">
import { ref } from 'vue'
import { useFluidStore } from '../store/fluid'
import { PRESETS } from '../utils/sph-engine'
import type { Preset, SourcePosition } from '../types'
import { SOURCE_POSITIONS } from '../types'

const store = useFluidStore()
const selectedPosition = ref<SourcePosition>('top')

function selectPreset(preset: Preset) {
  store.initSimulation(preset)
}

function toggleRun() {
  if (store.isRunning) {
    store.stop()
  } else {
    store.start()
  }
}

function reset() {
  store.reset()
}

function stepOnce() {
  store.stepOnce()
}

function onGravity(e: Event) {
  store.updateParam('gravity', parseFloat((e.target as HTMLInputElement).value))
}
function onViscosity(e: Event) {
  store.updateParam('viscosity', parseFloat((e.target as HTMLInputElement).value))
}
function onSmoothingRadius(e: Event) {
  store.updateParam('smoothingRadius', parseFloat((e.target as HTMLInputElement).value))
}
function onParticleCount(e: Event) {
  store.particleCount = parseInt((e.target as HTMLInputElement).value)
}
function onDt(e: Event) {
  store.updateParam('dt', parseFloat((e.target as HTMLInputElement).value))
}

function addSource() {
  store.addSource(selectedPosition.value)
}

function onSourceFlow(e: Event, sourceId: string) {
  store.updateSourceParam(sourceId, 'flowRate', parseFloat((e.target as HTMLInputElement).value))
}

function onSourceVelX(e: Event, sourceId: string) {
  store.updateSourceParam(sourceId, 'velocityX', parseFloat((e.target as HTMLInputElement).value))
}

function onSourceVelY(e: Event, sourceId: string) {
  store.updateSourceParam(sourceId, 'velocityY', parseFloat((e.target as HTMLInputElement).value))
}

function getPositionLabel(pos: SourcePosition): string {
  return SOURCE_POSITIONS.find(p => p.value === pos)?.label || pos
}
</script>

<template>
  <div class="w-72 bg-gray-800 rounded-lg border border-gray-700 p-4 flex flex-col gap-4 overflow-auto h-full">
    <!-- Presets -->
    <div>
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">预设场景</h3>
      <div class="grid grid-cols-2 gap-2">
        <button
          v-for="preset in PRESETS"
          :key="preset.name"
          @click="selectPreset(preset)"
          class="text-xs px-2 py-2 rounded transition text-left"
          :class="store.currentPreset.name === preset.name
            ? 'bg-blue-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'"
        >
          {{ preset.label }}
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-1">{{ store.currentPreset.description }}</p>
    </div>

    <!-- Controls -->
    <div class="flex gap-2">
      <button
        @click="toggleRun"
        class="flex-1 py-2 rounded text-sm font-medium transition"
        :class="store.isRunning
          ? 'bg-red-600 hover:bg-red-700 text-white'
          : 'bg-green-600 hover:bg-green-700 text-white'"
      >
        {{ store.isRunning ? '暂停' : '开始' }}
      </button>
      <button
        @click="reset"
        class="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-200 py-2 rounded text-sm transition"
      >
        重置
      </button>
      <button
        @click="stepOnce"
        :disabled="store.isRunning"
        class="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-200 py-2 rounded text-sm transition"
      >
        单步
      </button>
    </div>

    <!-- Parameters -->
    <div class="space-y-3">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">模拟参数</h3>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>重力</span>
          <span class="text-gray-300">{{ store.params.gravity.toFixed(1) }}</span>
        </label>
        <input
          type="range" min="0" max="20" step="0.1"
          :value="store.params.gravity"
          @input="onGravity"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>粘性</span>
          <span class="text-gray-300">{{ store.params.viscosity.toFixed(1) }}</span>
        </label>
        <input
          type="range" min="0" max="5" step="0.1"
          :value="store.params.viscosity"
          @input="onViscosity"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>光滑半径</span>
          <span class="text-gray-300">{{ store.params.smoothingRadius.toFixed(0) }}</span>
        </label>
        <input
          type="range" min="10" max="50" step="1"
          :value="store.params.smoothingRadius"
          @input="onSmoothingRadius"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>粒子数量</span>
          <span class="text-gray-300">{{ store.particleCount }}</span>
        </label>
        <input
          type="range" min="200" max="2000" step="50"
          :value="store.particleCount"
          @input="onParticleCount"
          class="w-full accent-blue-500 h-1.5"
        />
        <p class="text-xs text-gray-600 mt-0.5">重置后生效</p>
      </div>

      <div>
        <label class="flex justify-between text-xs text-gray-400 mb-1">
          <span>时间步长</span>
          <span class="text-gray-300">{{ store.params.dt.toFixed(4) }}</span>
        </label>
        <input
          type="range" min="0.001" max="0.02" step="0.001"
          :value="store.params.dt"
          @input="onDt"
          class="w-full accent-blue-500 h-1.5"
        />
      </div>
    </div>

    <!-- Fluid Sources -->
    <div class="space-y-3">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider">流体来源</h3>

      <div class="flex gap-2">
        <select
          v-model="selectedPosition"
          class="flex-1 bg-gray-700 text-gray-200 text-xs px-2 py-2 rounded border border-gray-600 focus:outline-none focus:border-blue-500"
        >
          <option v-for="pos in SOURCE_POSITIONS" :key="pos.value" :value="pos.value">
            {{ pos.label }}
          </option>
        </select>
        <button
          @click="addSource"
          class="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-2 rounded transition"
        >
          添加
        </button>
      </div>

      <div v-if="store.sources.length > 0" class="space-y-2">
        <div
          v-for="source in store.sources"
          :key="source.id"
          class="bg-gray-900 rounded p-2 border border-gray-700"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: source.color }"
              />
              <span class="text-xs text-gray-300 font-medium">{{ getPositionLabel(source.position) }}</span>
            </div>
            <div class="flex items-center gap-1">
              <button
                @click="store.toggleSource(source.id)"
                class="text-xs px-2 py-1 rounded transition"
                :class="source.enabled
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-600 text-gray-300'"
              >
                {{ source.enabled ? '开启' : '关闭' }}
              </button>
              <button
                @click="store.removeSource(source.id)"
                class="text-xs px-2 py-1 rounded bg-red-600 hover:bg-red-700 text-white transition"
              >
                删除
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div>
              <label class="flex justify-between text-xs text-gray-500 mb-1">
                <span>流量</span>
                <span class="text-gray-400">{{ source.flowRate.toFixed(1) }}/帧</span>
              </label>
              <input
                type="range" min="0" max="10" step="0.5"
                :value="source.flowRate"
                @input="onSourceFlow($event, source.id)"
                class="w-full accent-blue-500 h-1.5"
              />
            </div>
            <div>
              <label class="flex justify-between text-xs text-gray-500 mb-1">
                <span>X速度</span>
                <span class="text-gray-400">{{ source.velocityX.toFixed(0) }}</span>
              </label>
              <input
                type="range" min="-200" max="200" step="10"
                :value="source.velocityX"
                @input="onSourceVelX($event, source.id)"
                class="w-full accent-blue-500 h-1.5"
              />
            </div>
            <div>
              <label class="flex justify-between text-xs text-gray-500 mb-1">
                <span>Y速度</span>
                <span class="text-gray-400">{{ source.velocityY.toFixed(0) }}</span>
              </label>
              <input
                type="range" min="-200" max="200" step="10"
                :value="source.velocityY"
                @input="onSourceVelY($event, source.id)"
                class="w-full accent-blue-500 h-1.5"
              />
            </div>
          </div>
        </div>

        <button
          @click="store.clearSources"
          class="w-full text-xs py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-gray-300 transition"
        >
          清除所有来源
        </button>
      </div>

      <p v-else class="text-xs text-gray-500 italic">
        从边缘位置添加流体来源，观察粒子蓄积与溢散过程
      </p>
    </div>

    <!-- Stats -->
    <div class="mt-auto pt-3 border-t border-gray-700">
      <h3 class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">运行状态</h3>
      <div class="grid grid-cols-2 gap-2 text-xs">
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">FPS</span>
          <p class="text-green-400 font-mono text-sm">{{ store.fps }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">粒子数</span>
          <p class="text-blue-400 font-mono text-sm">{{ store.particleArray.length }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">平均密度</span>
          <p class="text-yellow-400 font-mono text-sm">{{ store.avgDensity.toFixed(0) }}</p>
        </div>
        <div class="bg-gray-900 rounded px-2 py-1.5">
          <span class="text-gray-500">最大速度</span>
          <p class="text-red-400 font-mono text-sm">{{ store.maxVelocity.toFixed(1) }}</p>
        </div>
      </div>
    </div>
  </div>
</template>
