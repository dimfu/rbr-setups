import { Scanner, Section } from "./scanner"

class LSP {
	props: Record<Section, Record<string, string>>
	source: string

	constructor(source: string) {
		this.source = source
		this.props = {} as typeof this.props
	}

	parse() {
		const scanner = new Scanner(this.source)
		const values = scanner.parse()
		this.props = values
		return values
	}
}

export default LSP
