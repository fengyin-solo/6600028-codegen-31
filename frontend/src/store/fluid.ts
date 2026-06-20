import { defineStore } from 'pinia'
import { SPHEngine, DEFAULT_PARAMS, PRESETS } from '../utils/sph-engine'
import type { SimParams, Preset, Particle, FluidSource, SourcePosition } from '../types'

export const useFluidStore = defineStore('fluid', {
  state: () => ({
    engine: null as SPHEngine | null,
    isRunning: false,
    particleCount: 800,
    currentPreset: PRESETS[0],
    params: { ...DEFAULT_PARAMS } as SimParams,
    fps: 0,
    frameCount: 0,
    sources: [] as FluidSource[],
    _animId: null as number | null,
    _lastTime: 0,
    _fpsAccum: 0,
    _fpsFrames: 0,
  }),
  getters: {
    particleArray: (state) => state.engine?.particles ?? [],
    avgDensity: (state) => {
      if (!state.engine || state.engine.particles.length === 0) return 0
      const sum = state.engine.particles.reduce((s, p) => s + p.density, 0)
      return sum / state.engine.particles.length
    },
    maxVelocity: (state) => {
      if (!state.engine || state.engine.particles.length === 0) return 0
      return Math.max(...state.engine.particles.map(p => Math.sqrt(p.vx * p.vx + p.vy * p.vy)))
    },
  },
  actions: {
    initSimulation(preset?: Preset) {
      if (preset) {
        this.currentPreset = preset
        this.params = { ...DEFAULT_PARAMS, ...preset.params }
        this.particleCount = preset.particleCount
      }
      const canvas = { width: 800, height: 500 }
      this.engine = new SPHEngine(this.particleCount, canvas.width, canvas.height, this.params)
      this.engine.initParticles(this.currentPreset.initialConfig, this.particleCount)
      for (const source of this.sources) {
        this.engine.addSource(source)
      }
      this.frameCount = 0
      this.fps = 0
    },
    start() {
      if (this.isRunning || !this.engine) return
      this.isRunning = true
      this._lastTime = performance.now()
      this._fpsAccum = 0
      this._fpsFrames = 0
      const loop = (now: number) => {
        if (!this.isRunning || !this.engine) return
        const elapsed = now - this._lastTime
        this._lastTime = now
        this._fpsAccum += elapsed
        this._fpsFrames++
        if (this._fpsAccum >= 500) {
          this.fps = Math.round(this._fpsFrames / (this._fpsAccum / 1000))
          this._fpsAccum = 0
          this._fpsFrames = 0
        }
        // Sub-steps for stability
        const subSteps = 3
        for (let s = 0; s < subSteps; s++) {
          this.engine.step()
        }
        this.frameCount++
        this._animId = requestAnimationFrame(loop)
      }
      this._animId = requestAnimationFrame(loop)
    },
    stop() {
      this.isRunning = false
      if (this._animId !== null) {
        cancelAnimationFrame(this._animId)
        this._animId = null
      }
    },
    reset() {
      this.stop()
      this.initSimulation(this.currentPreset)
    },
    stepOnce() {
      if (!this.engine || this.isRunning) return
      const subSteps = 3
      for (let s = 0; s < subSteps; s++) {
        this.engine.step()
      }
      this.frameCount++
    },
    updateParam(key: keyof SimParams, value: number) {
      this.params[key] = value
      if (this.engine) {
        this.engine.params[key] = value
        if (key === 'smoothingRadius') {
          this.engine['cellSize'] = value
        }
      }
    },
    addSource(position: SourcePosition) {
      const id = `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const velocityMap: Record<SourcePosition, { vx: number; vy: number }> = {
        'top': { vx: 0, vy: 50 },
        'bottom': { vx: 0, vy: -50 },
        'left': { vx: 50, vy: 0 },
        'right': { vx: -50, vy: 0 },
        'top-left': { vx: 35, vy: 35 },
        'top-right': { vx: -35, vy: 35 },
        'bottom-left': { vx: 35, vy: -35 },
        'bottom-right': { vx: -35, vy: -35 },
      }
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']
      const vel = velocityMap[position]
      const source: FluidSource = {
        id,
        position,
        enabled: true,
        flowRate: 2,
        velocityX: vel.vx,
        velocityY: vel.vy,
        color: colors[Math.floor(Math.random() * colors.length)],
      }
      this.sources.push(source)
      if (this.engine) {
        this.engine.addSource(source)
      }
      return id
    },
    removeSource(sourceId: string) {
      this.sources = this.sources.filter(s => s.id !== sourceId)
      if (this.engine) {
        this.engine.removeSource(sourceId)
      }
    },
    toggleSource(sourceId: string) {
      const source = this.sources.find(s => s.id === sourceId)
      if (source) {
        source.enabled = !source.enabled
        if (this.engine) {
          this.engine.updateSource(sourceId, { enabled: source.enabled })
        }
      }
    },
    updateSourceParam(sourceId: string, key: keyof FluidSource, value: number | boolean) {
      const source = this.sources.find(s => s.id === sourceId)
      if (source) {
        ;(source as any)[key] = value
        if (this.engine) {
          this.engine.updateSource(sourceId, { [key]: value })
        }
      }
    },
    clearSources() {
      this.sources = []
      if (this.engine) {
        this.engine.sources = []
      }
    },
  },
})
