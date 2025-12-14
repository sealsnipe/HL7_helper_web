import { describe, it, expect } from 'vitest'
import { parseHl7Message } from '@/utils/hl7Parser'

describe('parseHl7Message', () => {
  describe('basic parsing', () => {
    it('should return empty array for empty input', () => {
      expect(parseHl7Message('')).toEqual([])
    })

    it('should return empty array for null/undefined-like empty string', () => {
      expect(parseHl7Message('')).toEqual([])
    })

    it('should parse a simple MSH segment', () => {
      const message = 'MSH|^~\\&|SendingApp|SendingFac|ReceivingApp|ReceivingFac'
      const result = parseHl7Message(message)

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('MSH')
      expect(result[0].id).toBe('seg-0')
    })

    it('should parse multiple segments', () => {
      const message = `MSH|^~\\&|App|Fac|||
PID|1||12345^^^MRN||Doe^John`
      const result = parseHl7Message(message)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('MSH')
      expect(result[1].name).toBe('PID')
    })

    it('should handle Windows line endings (CRLF)', () => {
      const message = 'MSH|^~\\&|App\r\nPID|1'
      const result = parseHl7Message(message)

      expect(result).toHaveLength(2)
    })

    it('should handle Unix line endings (LF)', () => {
      const message = 'MSH|^~\\&|App\nPID|1'
      const result = parseHl7Message(message)

      expect(result).toHaveLength(2)
    })

    it('should skip empty lines', () => {
      const message = `MSH|^~\\&|App

PID|1

OBR|1`
      const result = parseHl7Message(message)

      expect(result).toHaveLength(3)
    })
  })

  describe('MSH segment special handling', () => {
    it('should correctly set MSH-1 as field separator', () => {
      const message = 'MSH|^~\\&|App'
      const result = parseHl7Message(message)

      expect(result[0].fields[0].position).toBe(1)
      expect(result[0].fields[0].value).toBe('|')
      expect(result[0].fields[0].isEditable).toBe(false)
    })

    it('should correctly set MSH-2 as encoding characters', () => {
      const message = 'MSH|^~\\&|App'
      const result = parseHl7Message(message)

      expect(result[0].fields[1].position).toBe(2)
      expect(result[0].fields[1].value).toBe('^~\\&')
      expect(result[0].fields[1].isEditable).toBe(false)
    })

    it('should correctly number MSH fields starting from position 3', () => {
      const message = 'MSH|^~\\&|SendingApp|SendingFac|ReceivingApp'
      const result = parseHl7Message(message)

      // MSH-1: |
      // MSH-2: ^~\&
      // MSH-3: SendingApp
      // MSH-4: SendingFac
      // MSH-5: ReceivingApp
      expect(result[0].fields).toHaveLength(5)
      expect(result[0].fields[2].position).toBe(3)
      expect(result[0].fields[2].value).toBe('SendingApp')
      expect(result[0].fields[3].position).toBe(4)
      expect(result[0].fields[4].position).toBe(5)
    })
  })

  describe('standard segment field parsing', () => {
    it('should correctly number fields for non-MSH segments', () => {
      const message = 'PID|1|2|3|4|5'
      const result = parseHl7Message(message)

      expect(result[0].fields).toHaveLength(5)
      expect(result[0].fields[0].position).toBe(1)
      expect(result[0].fields[0].value).toBe('1')
      expect(result[0].fields[4].position).toBe(5)
      expect(result[0].fields[4].value).toBe('5')
    })
  })

  describe('component parsing', () => {
    it('should parse components separated by ^', () => {
      const message = 'PID|1||123^^^MRN||Doe^John^Middle'
      const result = parseHl7Message(message)

      // PID-5: Doe^John^Middle
      const pid5 = result[0].fields[4]
      expect(pid5.components).toHaveLength(3)
      expect(pid5.components[0].value).toBe('Doe')
      expect(pid5.components[0].position).toBe(1)
      expect(pid5.components[1].value).toBe('John')
      expect(pid5.components[2].value).toBe('Middle')
    })

    it('should handle empty components', () => {
      const message = 'PID|1||^Middle^Last'
      const result = parseHl7Message(message)

      const pid3 = result[0].fields[2]
      expect(pid3.components).toHaveLength(3)
      expect(pid3.components[0].value).toBe('')
      expect(pid3.components[1].value).toBe('Middle')
      expect(pid3.components[2].value).toBe('Last')
    })
  })

  describe('subcomponent parsing', () => {
    it('should parse subcomponents separated by &', () => {
      const message = 'PID|1||123^456&789'
      const result = parseHl7Message(message)

      const pid3 = result[0].fields[2]
      expect(pid3.components).toHaveLength(2)
      expect(pid3.components[1].subComponents).toHaveLength(2)
      expect(pid3.components[1].subComponents[0].value).toBe('456')
      expect(pid3.components[1].subComponents[1].value).toBe('789')
    })
  })

  describe('repetition parsing', () => {
    it('should parse repetitions separated by ~', () => {
      const message = 'PID|1||ID1~ID2~ID3'
      const result = parseHl7Message(message)

      const pid3 = result[0].fields[2]
      expect(pid3.repetitions).toBeDefined()
      expect(pid3.repetitions).toHaveLength(3)
      expect(pid3.repetitions![0].value).toBe('ID1')
      expect(pid3.repetitions![1].value).toBe('ID2')
      expect(pid3.repetitions![2].value).toBe('ID3')
    })

    it('should parse repetitions with components', () => {
      const message = 'PID|1||ID1^Type1~ID2^Type2'
      const result = parseHl7Message(message)

      const pid3 = result[0].fields[2]
      expect(pid3.repetitions).toHaveLength(2)
      expect(pid3.repetitions![0].components).toHaveLength(2)
      expect(pid3.repetitions![0].components[0].value).toBe('ID1')
      expect(pid3.repetitions![0].components[1].value).toBe('Type1')
    })
  })

  describe('escape sequence handling', () => {
    it('should unescape \\F\\ to |', () => {
      const message = 'OBX|1|ST|CODE|1|Value\\F\\Pipe'
      const result = parseHl7Message(message)

      const obx5 = result[0].fields[4]
      expect(obx5.value).toBe('Value|Pipe')
    })

    it('should unescape \\S\\ to ^', () => {
      const message = 'OBX|1|ST|CODE|1|Value\\S\\Caret'
      const result = parseHl7Message(message)

      const obx5 = result[0].fields[4]
      expect(obx5.value).toBe('Value^Caret')
    })

    it('should unescape \\R\\ to ~', () => {
      const message = 'OBX|1|ST|CODE|1|Value\\R\\Tilde'
      const result = parseHl7Message(message)

      const obx5 = result[0].fields[4]
      expect(obx5.value).toBe('Value~Tilde')
    })

    it('should unescape \\T\\ to &', () => {
      const message = 'OBX|1|ST|CODE|1|Value\\T\\Ampersand'
      const result = parseHl7Message(message)

      const obx5 = result[0].fields[4]
      expect(obx5.value).toBe('Value&Ampersand')
    })

    it('should unescape \\E\\ to \\', () => {
      const message = 'OBX|1|ST|CODE|1|Value\\E\\Backslash'
      const result = parseHl7Message(message)

      const obx5 = result[0].fields[4]
      expect(obx5.value).toBe('Value\\Backslash')
    })

    it('should handle multiple escape sequences', () => {
      const message = 'OBX|1|ST|CODE|1|A\\F\\B\\S\\C\\R\\D'
      const result = parseHl7Message(message)

      const obx5 = result[0].fields[4]
      expect(obx5.value).toBe('A|B^C~D')
    })
  })

  describe('realistic HL7 messages', () => {
    it('should parse a typical ADT-A01 message', () => {
      const message = `MSH|^~\\&|ADT|MCM|LABADT|MCM|20250101120000||ADT^A01|MSG00001|P|2.5
EVN|A01|20250101120000
PID|1||12345^^^MRN^MR||DOE^JOHN^MIDDLE||19800101|M|||123 MAIN ST^^ANYTOWN^ST^12345
PV1|1|I|2000^2012^01||||004777^ATTEND^AARON^A|||SUR||||ADM|A0`
      const result = parseHl7Message(message)

      expect(result).toHaveLength(4)
      expect(result[0].name).toBe('MSH')
      expect(result[1].name).toBe('EVN')
      expect(result[2].name).toBe('PID')
      expect(result[3].name).toBe('PV1')

      // Check MSH-9 (Message Type)
      const msh9 = result[0].fields[8] // MSH-9 is at index 8 (after MSH-1 and MSH-2)
      expect(msh9.components[0].value).toBe('ADT')
      expect(msh9.components[1].value).toBe('A01')

      // Check PID-5 (Patient Name)
      const pid5 = result[2].fields[4]
      expect(pid5.components[0].value).toBe('DOE')
      expect(pid5.components[1].value).toBe('JOHN')
    })
  })
})
