export interface IModelClient {
  ask(question: string, context: string): string;
}