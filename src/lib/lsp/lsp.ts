import { Scanner } from "./scanner"

class LSP {
	source: string

	constructor(source: string) {
		this.source = source
	}

	parse() {
		const scanner = new Scanner(this.source)
		const values = scanner.parse()
		return values
	}
}

export default LSP
