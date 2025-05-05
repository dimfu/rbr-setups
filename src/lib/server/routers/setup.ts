import fs from "fs"
import { procedure, router } from "../trpc"

const setup = router({
	carList: procedure.query(() => {
		const setupDir = __dirname.split(".next")[0] + "public/setup_options"
		return new Promise<string[]>((resolve) => {
			fs.readdir(setupDir, (err, files) => {
				if (err) {
					console.error(err)
					resolve([])
				} else {
					resolve(files)
				}
			})
		})
	})
})
export default setup
