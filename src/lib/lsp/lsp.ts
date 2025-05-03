import { Scanner, Section, SyntaxNode, TokenKinds } from "./scanner"

class LSP {
	props: Record<Section, Record<string, string>>
	nodes: SyntaxNode[] = []
	source: string

	constructor(source: string) {
		this.source = source
		this.props = {} as typeof this.props
	}

	parse() {
		const scanner = new Scanner(this.source)
		const values = scanner.parse()
		this.props = values
		this.nodes = scanner.nodes
		return values
	}

	update(target: string, value: string) {
		const valueNode = this.findSubSectionNode(target)
		this.source =
			this.source.slice(0, valueNode.tokenAt.index) +
			value +
			this.source.slice(valueNode.tokenAt.index + valueNode.tokenAt.column)

		this.parse()
	}

	findSubSectionNode(target: string) {
		const [sectionName, key] = target.split(".")
		if (!sectionName || !key) {
			throw new Error("Target must be in 'Section.Key' format")
		}

		// find the section index inside the root position
		const sectionIdx = this.nodes.findIndex(
			(node, i) =>
				node.type === TokenKinds.Identifier &&
				node.literal === sectionName &&
				// i + 1 because if the identifier have a list it is suppose to be the next node after i
				this.nodes[i + 1]?.type === TokenKinds.List
		)

		if (sectionIdx === -1) {
			throw new Error(`Section '${sectionName}' not found`)
		}

		// get the list node by the position of + 1
		const listNode = this.nodes[sectionIdx + 1]
		const subNodes = listNode.list
		if (!subNodes || subNodes.length === 0) {
			throw new Error(`No items found in section '${sectionName}'`)
		}

		// find the key/identifier node index
		const keyIdx = subNodes.findIndex(
			(node, i) =>
				node.type === TokenKinds.Identifier &&
				node.literal === key &&
				// same thing to this, if the key/identifier have a value it is suppose to be the next node after i
				subNodes[i + 1]?.type === TokenKinds.Value
		)

		if (keyIdx === -1) {
			throw new Error(`Key '${key}' not found in section '${sectionName}'`)
		}

		return subNodes[keyIdx + 1]
	}
}

export default LSP
