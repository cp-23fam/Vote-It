<template>
  <div class="timer" :class="{ large, urgent: seconds <= 30 && seconds > 0 }">
    <svg class="timer-ring" :width="large ? 64 : 44" :height="large ? 64 : 44" viewBox="0 0 44 44">
      <circle
        class="ring-bg"
        cx="22" cy="22"
        :r="radius"
        fill="none"
        stroke-width="2.5"
      />
      <circle
        class="ring-progress"
        cx="22" cy="22"
        :r="radius"
        fill="none"
        stroke-width="2.5"
        stroke-linecap="round"
        :stroke-dasharray="circumference"
        :stroke-dashoffset="dashOffset"
        transform="rotate(-90 22 22)"
      />
    </svg>
    <div class="timer-label">
      <span class="timer-mm">{{ mm }}</span>
      <span class="timer-sep">:</span>
      <span class="timer-ss">{{ ss }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  seconds: { type: Number, required: true },
  totalSeconds: { type: Number, default: null },
  large: { type: Boolean, default: false }
})

const radius = 18
const circumference = 2 * Math.PI * radius

const mm = computed(() => String(Math.floor(props.seconds / 60)).padStart(2, '0'))
const ss = computed(() => String(props.seconds % 60).padStart(2, '0'))

const dashOffset = computed(() => {
  if (!props.totalSeconds) return 0
  const pct = props.seconds / props.totalSeconds
  return circumference * (1 - pct)
})
</script>

<style scoped>
.timer {
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.timer-ring {
  flex-shrink: 0;
}

.ring-bg {
  stroke: var(--border-strong);
}

.ring-progress {
  stroke: var(--gold);
  transition: stroke-dashoffset 1s linear;
}

.urgent .ring-progress {
  stroke: var(--red);
  animation: ring-pulse 1s ease-in-out infinite;
}

@keyframes ring-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.timer-label {
  display: flex;
  align-items: baseline;
  gap: 1px;
  font-family: var(--font-mono);
  font-size: 16px;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.large .timer-label {
  font-size: 22px;
}

.timer-sep {
  color: var(--text-muted);
  margin: 0 1px;
}

.urgent .timer-label {
  color: var(--red);
}
</style>
