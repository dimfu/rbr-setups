import { router } from '../trpc'
import setup from './setup'

export const appRouter = router({
	setup: setup
})
// export type definition of API
export type AppRouter = typeof appRouter
