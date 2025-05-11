import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		include: ['tests/lib/**/*.test.*'],
		exclude: ['tests/worker/**'],
	},
})
