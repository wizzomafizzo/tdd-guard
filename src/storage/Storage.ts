export interface Storage {
  saveTest(content: string): Promise<void>
  saveTodo(content: string): Promise<void>
  saveEdit(content: string): Promise<void>
  getTest(): Promise<string | null>
  getTodo(): Promise<string | null>
  getEdit(): Promise<string | null>
}
