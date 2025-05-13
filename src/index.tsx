import { Context, Hono } from 'hono'
import type { D1Database, Fetcher } from '@cloudflare/workers-types'
import { renderer } from './renderer'
import { db, users } from './lib/db/schema'
import { authHandler, initAuthConfig, verifyAuth } from '@hono/auth-js'
import Discord from '@auth/core/providers/discord'
import { eq } from 'drizzle-orm'

export type Env = {
  __STATIC_ASSET: Fetcher
  BASE_URL: string
  DB: D1Database
  AUTH_SECRET: string
  AUTH_DISCORD_ID: string
  AUTH_DISCORD_SECRET: string
}

const app = new Hono<{ Bindings: Env }>()

app.use(
  '*',
  initAuthConfig((c: Context<{ Bindings: Env }>) => ({
    basePath: "/api/auth",
    secret: c.env.AUTH_SECRET,
    providers: [
      Discord({
        clientId: c.env.AUTH_DISCORD_ID,
        clientSecret: c.env.AUTH_DISCORD_SECRET,
      }),
    ],
    callbacks: {
      async signIn({ user }) {
        if (!user || !user.email) return false
        const drizzle = db(c.env)
        try {
          const existingUser = await drizzle
            .select()
            .from(users)
            .where(eq(users.email, user.email))
            .get()

          if (!existingUser) {
            await drizzle.insert(users).values({
              id: crypto.randomUUID(),
              name: user.name || '',
              email: user.email,
              image: user.image || null,
            })
          } else {
            await drizzle
              .update(users)
              .set({
                name: user.name || existingUser.name,
                image: user.image || existingUser.image,
              })
              .where(eq(users.email, user.email))
          }
          return true
        } catch (error) {
          console.error('Failed to save user:', error)
          return false
        }
      }
    }
  }))
)

app.use('/api/auth/*', authHandler())
app.use('/api/*', verifyAuth())
app.get('/api/protected', (c) => {
  const auth = c.get('authUser')
  return c.json(auth)
})

app.get("/car-list", async (c) => {
  const res = await c.env.__STATIC_ASSET.fetch(`${c.env.BASE_URL}/static/car_list.json`)
  if (!res.ok) {
    return c.text('Not found', 404)
  }
  const json = await res.json() as string[]
  return c.json(json)
})

app.get("/", async (c) => {
  const drizzle = db(c.env)
  const result = await drizzle.select().from(users).all()
  return c.json(result)
})

export default app
