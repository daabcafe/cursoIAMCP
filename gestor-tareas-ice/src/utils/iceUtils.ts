import type { Task } from '../types/task'

export function calculateIce(
  impact: number | null,
  confidence: number | null,
  ease: number | null,
): number | null {
  if (impact === null || confidence === null || ease === null) {
    return null
  }

  return impact * confidence * ease
}

export function sortByIce(tasks: Task[]): Task[] {
  return [...tasks].sort((taskA, taskB) => {
    const scoreA = calculateIce(taskA.impact, taskA.confidence, taskA.ease)
    const scoreB = calculateIce(taskB.impact, taskB.confidence, taskB.ease)

    if (scoreA === null && scoreB === null) {
      return 0
    }

    if (scoreA === null) {
      return 1
    }

    if (scoreB === null) {
      return -1
    }

    return scoreB - scoreA
  })
}
