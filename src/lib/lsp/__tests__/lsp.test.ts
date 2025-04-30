import { expect, test } from 'vitest'
import { join } from 'path'
import { readFile } from 'fs/promises'

import { SECTIONS } from '../scanner'
import LSP from '../lsp'

test('should get values from set section', async () => {
	const filepath = join(process.cwd(), "src/lib/lsp/__tests__/grip.lsp")
	const content = await readFile(filepath, "utf-8")
	const Lsp = new LSP(content)
	expect(Lsp).toBeInstanceOf(LSP)

	const values = Lsp.parse()
	expect(values).not.toBeNull()
})

test('should not include unrecognized section value', async () => {
	const Lsp = new LSP(`(("CarSetup"
 Car             ("Car"
 MaxSteeringLock 0.615000
                  FrontRollBarStiffness 16200.000000
                  RearRollBarStiffness 18400.000000
                                   MaxSteeringLock 
                  FrontRollBarStiffness 
                  RearRollBarStiffness 
                  )
 Deez          (":-D"
 NutsIdentifier    0 
                  )
 Engine          (":-D"
 Features_NGP    0 
                  )
 `)
	const values = Lsp.parse()
	const keys = Object.keys(values)
	expect(keys).toStrictEqual(SECTIONS)
})

