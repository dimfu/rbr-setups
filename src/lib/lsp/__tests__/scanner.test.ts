
import { expect, test, describe } from 'vitest'
import { join } from 'path'
import { readFile } from 'fs/promises'

import { Scanner, SECTIONS, TokenKinds } from '../scanner'

describe('Scanner parsing behavior', () => {
	test('tokenizes numbers and identifiers', () => {
		const scanner = new Scanner('(Car 123 "hello")')
		const tokens = []
		while (scanner.peekToken().type !== TokenKinds.EOF) {
			tokens.push(scanner.peekToken().type)
			scanner.currentToken = scanner.scanToken()
		}
		expect(tokens).toEqual([
			TokenKinds.OpenParen,
			TokenKinds.Identifier,
			TokenKinds.Value,
			TokenKinds.String,
			TokenKinds.ClosedParen,
		])
	})

	test('throws on unterminated string', () => {
		expect(() => {
			new Scanner('"hello')
		}).toThrow('Unterminated string')
	})

	test('parses simple expression into node tree', () => {
		const scanner = new Scanner('(MaxSteeringLock 0.615)')
		const result = scanner.parse()
		expect(result.Car?.MaxSteeringLock).toBeUndefined()
	})

	test('should get values from set section', async () => {
		const filepath = join(process.cwd(), "src/lib/lsp/__tests__/grip.lsp")
		const content = await readFile(filepath, "utf-8")
		const scanner = new Scanner(content)
		expect(scanner).toBeInstanceOf(Scanner)
		const values = scanner.parse()

		const flattenNodes = scanner.nodes.flatMap(node => [node, ...(node.list ?? [])])
		flattenNodes.forEach((node) => {
			if ((node.type === TokenKinds.Identifier || node.type === TokenKinds.Value) && node.tokenAt) {
				const substr = scanner.source.substring(node.tokenAt.index, node.tokenAt.index + node.tokenAt.column)
				expect(node.literal).toBe(substr)
			}
		})

		expect(values).not.toBeNull()
	})

	test('pairs identifiers with values only', () => {
		const scanner = new Scanner(`((Car (MaxSteeringLock 0.615 Orphan)))`)
		const result = scanner.parse()
		console.log(result)
		expect(result.Car).toEqual({ MaxSteeringLock: '0.615' })
	})

	test('should not include unrecognized section value', () => {
		const scanner = new Scanner(`(("CarSetup"
     Car             ("Car"
     MaxSteeringLock 0.615000
     RearRollBarStiffness 
     )
     UnknownSection (":-D"
     RandomKey 123
     )
    )`)

		const values = scanner.parse()
		const keys = Object.keys(values)
		expect(keys).toStrictEqual(SECTIONS)
	})
})

