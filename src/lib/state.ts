import { MemoryFeedbackStore, MemoryStore } from "@reflexui-jev/core";

// One decision cache and one feedback store per server process, like a cache in production.
// Stored on globalThis so they survive hot reloads in dev.
const g = globalThis as unknown as { __reflexStore?: MemoryStore; __reflexFeedback?: MemoryFeedbackStore };

export const decisionStore = () => (g.__reflexStore ??= new MemoryStore());
export const feedbackStore = () => (g.__reflexFeedback ??= new MemoryFeedbackStore());
export const resetState = () => {
  g.__reflexStore = new MemoryStore();
  g.__reflexFeedback = new MemoryFeedbackStore();
};
