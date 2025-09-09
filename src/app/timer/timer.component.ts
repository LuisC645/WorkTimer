import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

const TOTAL_MINUTES = 60;
const TOTAL_TASKS = 17;
const HOUR_MS = TOTAL_MINUTES * 60 * 1000;
const TASK_MS = Math.round(HOUR_MS / TOTAL_TASKS);

@Component({
  selector: 'app-timer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timer.html',
  styleUrls: ['./timer.scss']
})
export class TimerComponent {
  totalTasks = TOTAL_TASKS;
  taskMs = TASK_MS;
  taskArray = Array.from({ length: TOTAL_TASKS });

  currentTask = signal(1);
  remainingMs = signal(TASK_MS);
  running = signal(false);

  private intervalId?: any;
  hourStart = signal<Date | null>(null);
  private hourEndEpochMs: number | null = null;
  cycles = signal(0);

  // AUDIO
  private audioCtx?: AudioContext;
  private ensureAudioCtx() {
    if (!this.audioCtx) this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
  }
  private playAlarm() {
  this.ensureAudioCtx();
  const ctx = this.audioCtx!;

  // Primer tono fuerte (agudo)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'square';
  osc1.frequency.value = 800; // agudo
  gain1.gain.value = 0.4;      // más volumen
  osc1.connect(gain1).connect(ctx.destination);
  osc1.start();
  osc1.stop(ctx.currentTime + 0.10);

  // Segundo tono grave (contraste)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'sawtooth';
  osc2.frequency.value = 1500;  // grave
  gain2.gain.value = 0.4;
  osc2.connect(gain2).connect(ctx.destination);
  osc2.start(ctx.currentTime + 0.1);
  osc2.stop(ctx.currentTime + 0.20);

  /*  Tercer tono repite el agudo
  const osc3 = ctx.createOscillator();
  const gain3 = ctx.createGain();
  osc3.type = 'square';
  osc3.frequency.value = 1000;
  gain3.gain.value = 0.4;
  osc3.connect(gain3).connect(ctx.destination);
  osc3.start(ctx.currentTime + 0.5);
  osc3.stop(ctx.currentTime + 0.75);
  */
}

  // mm:ss
  mmss = computed(() => {
    const ms = this.remainingMs();
    const totalSec = Math.ceil(ms / 1000);
    const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const s = (totalSec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  startTimeStr = computed(() => {
    const d = this.hourStart();
    return d ? d.toLocaleTimeString() : '—';
  });

  percent = computed(() => {
    const taskIndex = this.currentTask() - 1;
    const elapsedInTask = this.taskMs - this.remainingMs();
    const elapsed = taskIndex * this.taskMs + elapsedInTask;
    return Math.min(100, (elapsed / HOUR_MS) * 100);
  });

  start() {
    if (this.running()) return;
    this.ensureAudioCtx();

    if (!this.hourStart()) {
      const now = new Date();
      this.hourStart.set(now);
      this.hourEndEpochMs = now.getTime() + HOUR_MS;
    }
    this.running.set(true);

    this.intervalId = setInterval(() => {
      if (this.hourEndEpochMs && Date.now() >= this.hourEndEpochMs) {
        this.cycles.set(this.cycles() + 1);
        this.playAlarm();
        setTimeout(() => this.playAlarm(), 800);

        const now = new Date();
        this.hourStart.set(now);
        this.hourEndEpochMs = now.getTime() + HOUR_MS;
        this.currentTask.set(1);
        this.remainingMs.set(this.taskMs);
        return;
      }

      const left = this.remainingMs() - 1000;
      // Dentro del setInterval
      if (left > 0) {
        this.remainingMs.set(left);
      } else {
        // cambio de tarea → popup
        this.playAlarm();

        const next = this.currentTask() % this.totalTasks + 1;
        this.currentTask.set(next);
        this.remainingMs.set(this.taskMs);
      }

      if (this.hourEndEpochMs && Date.now() >= this.hourEndEpochMs) {
        alert("¡Has completado 60 minutos! 🎉");
        // ... reinicia la hora y tareas
      }

    }, 1000);
  }

  pause() {
    if (!this.running()) return;
    clearInterval(this.intervalId);
    this.running.set(false);
  }

  resetCycle() {
    clearInterval(this.intervalId);
    this.running.set(false);
    this.currentTask.set(1);
    this.remainingMs.set(this.taskMs);
    this.hourStart.set(null);
    this.hourEndEpochMs = null;
    this.cycles.set(0);
  }
}
