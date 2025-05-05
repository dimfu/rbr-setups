import fs from "fs"
import { procedure, router } from "../trpc"
import path from "path"

const setup = router({
	carList: procedure.query(() => {
		const setupDir = path.resolve(process.cwd() + '/public/setup_options')
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
