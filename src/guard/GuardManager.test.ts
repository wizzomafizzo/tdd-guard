import { describe, it, expect, beforeEach } from 'vitest'
import { GuardManager } from './GuardManager'
import { Storage } from '../storage/Storage'
import { MemoryStorage } from '../storage/MemoryStorage'
import { FileStorage } from '../storage/FileStorage'

describe('GuardManager', () => {
  let storage: Storage
  let guardManager: GuardManager

  beforeEach(() => {
    storage = new MemoryStorage()
    guardManager = new GuardManager(storage)
  })

  describe('constructor', () => {
    it('accepts a Storage instance', () => {
      const customStorage = new MemoryStorage()
      const manager = new GuardManager(customStorage)

      expect(manager['storage']).toBe(customStorage)
    })

    it('uses FileStorage by default', () => {
      const manager = new GuardManager()

      expect(manager['storage']).toBeInstanceOf(FileStorage)
    })
  })

  describe('isEnabled', () => {
    it('returns true when no config exists (default enabled)', async () => {
      expect(await guardManager.isEnabled()).toBe(true)
    })

    it('returns false when guard is disabled in config', async () => {
      await storage.saveConfig(JSON.stringify({ guardEnabled: false }))

      expect(await guardManager.isEnabled()).toBe(false)
    })

    it('returns true when guard is enabled in config', async () => {
      await storage.saveConfig(JSON.stringify({ guardEnabled: true }))

      expect(await guardManager.isEnabled()).toBe(true)
    })
  })

  describe('enable', () => {
    it('enables the guard', async () => {
      await guardManager.disable() // Start with disabled
      await guardManager.enable()

      expect(await guardManager.isEnabled()).toBe(true)
    })
  })

  describe('disable', () => {
    it('disables the guard', async () => {
      await guardManager.enable() // Start with enabled
      await guardManager.disable()

      expect(await guardManager.isEnabled()).toBe(false)
    })
  })
})
