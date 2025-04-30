import { expect, test } from 'vitest'
import LSP from '../lsp'
import { join } from 'path'
import { readFile } from 'fs/promises'

test('should get values from set section', async () => {
	const filepath = join(process.cwd(), "src/lib/lsp/__tests__/grip.lsp")
	const content = await readFile(filepath, "utf-8")
	const Lsp = new LSP(content)
	expect(Lsp).toBeInstanceOf(LSP)

	const values = Lsp.parse()
	expect(values).not.toBeNull()
})

