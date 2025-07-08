import { describe, test, expect } from 'vitest'
import { testData } from '../../test'
import { processContext, generateDynamicContext } from './context'
import { prompts } from '../prompts/prompts'

describe('processContext', () => {
  describe('when Edit operation', () => {
    test('should format Edit operation with file path, old string, and new string', () => {
      const editOperation = testData.editOperation()
      const context = {
        modifications: JSON.stringify(editOperation),
      }

      const result = processContext(context)

      expect(result).toContain(prompts.EDIT_INSTRUCTIONS)
      expect(result).toContain('### File Path')
      expect(result).toContain('```')
      expect(result).toContain(editOperation.tool_input.file_path)
      expect(result).toContain('### Old String')
      expect(result).toContain(editOperation.tool_input.old_string)
      expect(result).toContain('### New String')
      expect(result).toContain(editOperation.tool_input.new_string)
    })
  })

  describe('when MultiEdit operation', () => {
    test('should format MultiEdit operation with file path and edits array', () => {
      const multiEditOperation = testData.multiEditOperation()
      const context = {
        modifications: JSON.stringify(multiEditOperation),
      }

      const result = processContext(context)

      expect(result).toContain(prompts.MULTI_EDIT_INSTRUCTIONS)
      expect(result).toContain('### File Path')
      expect(result).toContain('```')
      expect(result).toContain(multiEditOperation.tool_input.file_path)
      expect(result).toContain('### Edits')
      expect(result).toContain('#### Edit 1:')
      expect(result).toContain('**Old String:**')
      expect(result).toContain(
        multiEditOperation.tool_input.edits[0].old_string
      )
      expect(result).toContain('**New String:**')
      expect(result).toContain(
        multiEditOperation.tool_input.edits[0].new_string
      )
    })
  })

  describe('when Write operation', () => {
    test('should format Write operation with file path and content', () => {
      const writeOperation = testData.writeOperation()
      const context = {
        modifications: JSON.stringify(writeOperation),
      }

      const result = processContext(context)

      expect(result).toContain(prompts.WRITE_INSTRUCTIONS)
      expect(result).toContain('### File Path')
      expect(result).toContain('```')
      expect(result).toContain(writeOperation.tool_input.file_path)
      expect(result).toContain('### Content')
      expect(result).toContain(writeOperation.tool_input.content)
    })
  })

  describe('when test output is provided', () => {
    test('should append test information after modification details', () => {
      const editOperation = testData.editOperation()
      const testOutput = 'Test failed: Expected 5 but got 4'
      const context = {
        modifications: JSON.stringify(editOperation),
        test: testOutput,
      }

      const result = processContext(context)

      expect(result).toContain(prompts.EDIT_INSTRUCTIONS)
      expect(result).toContain('### Last Test Output')
      expect(result).toContain('```')
      expect(result).toContain(testOutput)
    })
  })

  describe('when todo is provided', () => {
    test('should append todo information after modification details', () => {
      const editOperation = testData.editOperation()
      const todoJson = JSON.stringify(
        testData.todoWriteOperation().tool_input.todos
      )
      const context = {
        modifications: JSON.stringify(editOperation),
        todo: todoJson,
      }

      const result = processContext(context)

      expect(result).toContain(prompts.EDIT_INSTRUCTIONS)
      expect(result).toContain('### Latest Todo State')
      expect(result).toContain('[pending] Implement feature (high)')
    })
  })
})

describe('generateDynamicContext', () => {
  test('should combine role prompt, TDD instructions, processed context, and answering instructions', () => {
    const editOperation = testData.editOperation()
    const context = {
      modifications: JSON.stringify(editOperation),
    }

    const result = generateDynamicContext(context)

    // Should have all parts in the correct order
    expect(result).toContain(prompts.ROLE_PROMPT)
    expect(result).toContain(prompts.TDD_INSTRUCTIONS)
    expect(result).toContain(prompts.EDIT_INSTRUCTIONS)
    expect(result).toContain(prompts.ANSWERING_INSTRUCTIONS)

    // Verify order
    const roleIndex = result.indexOf(prompts.ROLE_PROMPT)
    const tddIndex = result.indexOf(prompts.TDD_INSTRUCTIONS)
    const editIndex = result.indexOf(prompts.EDIT_INSTRUCTIONS)
    const answerIndex = result.indexOf(prompts.ANSWERING_INSTRUCTIONS)

    expect(roleIndex).toBeLessThan(tddIndex)
    expect(tddIndex).toBeLessThan(editIndex)
    expect(editIndex).toBeLessThan(answerIndex)
  })
})
