import { promises as fs } from "fs"
import { procedure, router } from "../trpc"
import path from "path"
import { z } from "zod"
import { TRPCError } from "@trpc/server"
import LSP from "@/lib/lsp/lsp"

// setup options that located inside the public folder
const SETUP_DIR = path.resolve(process.cwd() + '/public/setup_options')

const RoadTypeEnum = z.enum(['r_tarmac', 'r_gravel', 'r_snow'])
export type RoadType = z.infer<typeof RoadTypeEnum>

const setup = router({
	load: procedure.input(
		z.object({
			name: z.string(),
			type: RoadTypeEnum,
			buf: z.array(z.number()),
		}),
	).mutation(async (opts) => {
		const buffer = Buffer.from(opts.input.buf)
		if (buffer.byteLength > 48 * 1024) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "File is too large. Max size is 48KB."
			})
		}

		const folderPath = path.join(SETUP_DIR, opts.input.name)
		try {
			const files = await fs.readdir(folderPath)
			const setupFile = files.find((file) => path.parse(file).name === opts.input.type)
			if (!setupFile) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: `Setup type "${opts.input.type}" not found in "${opts.input.name}"`,
				})
			}

			const filePath = path.join(folderPath, setupFile)
			const stats = await fs.stat(filePath)

			if (!stats.isFile()) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Expected a file, but "${setupFile}" is not a file.`,
				})
			}
			const optSource = await fs.readFile(filePath, "utf-8")
			const setupSource = buffer.toString("utf-8")
			const setup = new LSP(setupSource, optSource).parse()
			return setup
		} catch (error) {
			console.error("Error reading setup file:", error)
			throw new TRPCError({
				code: "INTERNAL_SERVER_ERROR",
				message: error instanceof Error ? error.message : "Unexpected error",
			})
		}
	}),
	carList: procedure.query(async () => {
		return await fs.readdir(SETUP_DIR)
	})
})
export default setup
