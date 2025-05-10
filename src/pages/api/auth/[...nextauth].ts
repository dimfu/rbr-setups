import { authConfigs } from "@/lib/server/auth"
import NextAuth from "next-auth"

export default NextAuth(authConfigs)
