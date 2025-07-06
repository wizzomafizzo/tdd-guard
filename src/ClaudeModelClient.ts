import { IModelClient } from './types/ModelClient'
import { Context } from './types/Context'
import { execSync } from 'child_process'

export class ClaudeModelClient implements IModelClient {
  ask(question: string, context: Context): string {
    let contextExplanation = '\n\nThe following context is provided:\n'
    contextExplanation +=
      'Edit: This section shows the changes that the agent wants to make\n'

    let contextString = `<edit>${context.edit}</edit>`

    if (context.todo) {
      contextExplanation += "Todo: Current state of the agent's task list\n"
      contextString += `<todo>${context.todo}</todo>`
    }

    if (context.test) {
      contextExplanation += 'Test: The test output from running the tests\n'
      contextString += `<test>${context.test}</test>`
    }

    const prompt = `${question}${contextExplanation}${contextString}`
    const escapedPrompt = prompt.replace(/'/g, "'\\''")
    const command = `claude --print '${escapedPrompt}' --output-format json --max-turns 1 --model sonnet`

    const output = execSync(command, { encoding: 'utf-8', timeout: 10000 })
    const response = JSON.parse(output)

    return response.result
  }
}
