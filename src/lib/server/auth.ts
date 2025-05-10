import type {
	GetServerSidePropsContext,
	NextApiRequest,
	NextApiResponse,
} from "next"
import { PrismaAdapter } from "@auth/prisma-adapter"
import type { NextAuthOptions } from "next-auth"
import { getServerSession } from "next-auth"
import DiscordProvider from "next-auth/providers/discord"
import prisma from "./prisma"

export const authConfigs = {
	adapter: PrismaAdapter(prisma),
	providers: [
		DiscordProvider({
			clientId: `${process.env.AUTH_DISCORD_ID}`,
			clientSecret: `${process.env.AUTH_DISCORD_SECRET}`
		})
	],
} satisfies NextAuthOptions

export function auth(
	...args:
		| [GetServerSidePropsContext["req"], GetServerSidePropsContext["res"]]
		| [NextApiRequest, NextApiResponse]
		| []
) {
	return getServerSession(...args, authConfigs)
}
