export interface Task {
  id: string
  name: string
  description: string
  impact: number | null
  confidence: number | null
  ease: number | null
}

export interface IceValues {
  impact: number
  confidence: number
  ease: number
}
