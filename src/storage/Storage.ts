export interface Storage {
  saveTest(content: string): Promise<void>
  saveTodo(content: string): Promise<void>
  saveModifications(content: string): Promise<void>
  getTest(): Promise<string | null>
  getTodo(): Promise<string | null>
  getModifications(): Promise<string | null>
}
