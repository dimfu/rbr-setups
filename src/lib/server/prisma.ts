import { PrismaLibSQL } from "@prisma/adapter-libsql"
import { PrismaClient } from "@/generated/prisma/client"

const globalForPrisma = global as unknown as {
	prisma: PrismaClient | undefined
}

const adapter = new PrismaLibSQL({
	url: `${process.env.TURSO_DATABASE_URL}`,
	authToken: `${process.env.TURSO_AUTH_TOKEN}`,
})

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

export default prisma
