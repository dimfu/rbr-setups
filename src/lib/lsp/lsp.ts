import { Scanner, Setup, SetupValues, SyntaxNode, TokenKinds } from "./scanner"
import setupOptions from "./setup_options.json"

type SetupOptionKeys = 'min' | 'max' | 'step'

class LSP {
	props: Setup
	options: Record<string, string>
	nodes: SyntaxNode[] = []
	setupSource: string
	optionsSource?: string

	constructor(setupSource: string, optionsSource?: string) {
		this.setupSource = setupSource
		this.optionsSource = optionsSource
		this.props = {}
		this.options = {}
	}

	parse() {
		const scannerSetup = new Scanner(this.setupSource)
		const valuesSetup = scannerSetup.parse()
		this.props = valuesSetup
		this.nodes = scannerSetup.nodes

		if (this.optionsSource) {
			const scannerOptions = new Scanner(this.optionsSource)
			const values = scannerOptions.parse()
			this.options = this.flattenObject(values)
			this.fillSetupValues()
		}

		return valuesSetup
	}

	update(target: string, value: string) {
		if (!this.optionsSource) {
			throw new Error("Need options source parameter in order to update the car setup")
		}

		const validatedVal = this.validateSetupOpt(target, value)

		const node = this.findSubSectionNode(target)
		this.setupSource =
			this.setupSource.slice(0, node.tokenAt.index) +
			validatedVal +
			this.setupSource.slice(node.tokenAt.index + node.tokenAt.column)

		// reparse the sources since we updated the setup source
		this.parse()
	}

	validateSetupOpt(target: string, value: string) {
		const [, key] = this.checkSectionKey(target)
		const parsedVal = parseFloat(value)
		if (isNaN(parsedVal)) {
			throw new Error(`Invalid numeric value: ${value}`)
		}
		const numericVal = parsedVal.toFixed(6)

		const rules: Record<string, (opt: string) => void> = {
			min: (opt: string) => {
				const threshold = parseFloat(this.options[opt])
				if (threshold > parsedVal) {
					throw new Error(`Value '${numericVal}' cannot be lower than ${threshold} for ${target}`)
				}
			},
			max: (opt: string) => {
				const threshold = parseFloat(this.options[opt])
				if (threshold < parsedVal) {
					throw new Error(`Value '${numericVal}' cannot be higher than ${threshold} for ${target}`)
				}
			},

			// Some values ingame are not changeable, that if the default value are not a valid step that are given by the base option
			// it will throw an error if we uncomment the step rule, will uncomment until I found how to determine which setup opt is disabled
			//step: (opt: string) => {
			//	const step = parseFloat(this.options[opt])
			//	const base = 0
			//	const epsilon = 1e-6
			//
			//	const diff = Math.abs((parsedVal - base) % step)
			//
			//	if (diff > epsilon && Math.abs(diff - step) > epsilon) {
			//		throw new Error(`Value '${numericVal}' is not a multiple of step '${step}'`)
			//	}
			//},
		};

		const optionGroup = setupOptions[key]
		if (!optionGroup) {
			throw new Error(`No setup options found for key '${key}'`)
		}

		for (const optKey in optionGroup) {
			const opt = optionGroup[optKey as SetupOptionKeys]
			if (!opt || !rules[optKey]) continue
			rules[optKey](opt)
		}

		return numericVal
	}

	checkSectionKey(target: string): [string, keyof typeof setupOptions] {
		const [sectionName, key] = target.split(".")
		if (!sectionName || !key) {
			throw new Error("Target must be in 'Section.Key' format")
		}

		if (!(key in setupOptions)) {
			throw new Error(`Key '${target}' is not recognized as setup options`)
		}

		return [sectionName, key as keyof typeof setupOptions]
	}

	fillSetupValues() {
		// get every sections key from setup object
		const sections: string[] = []
		Object.keys(this.props).forEach((section) => {
			const subsections: string[] = []
			Object.keys(this.props[section]).forEach((subsection) => {
				const key = `${section}.${subsection}`
				try {
					this.checkSectionKey(key)
					subsections.push(key)
				} catch {
					// continue the iteration since we dont need to throw non existing key
				}
			})
			sections.push(...subsections)
		})
		// fill every sub section values of min and max
		for (const sectionStr of sections) {
			const key = sectionStr as keyof typeof setupOptions
			let section: string, subsection: keyof typeof setupOptions
			try {
				[section, subsection] = this.checkSectionKey(key)
			} catch {
				continue // skip invalid section strings
			}

			const optionGroup = setupOptions[subsection]
			if (!optionGroup) {
				continue
			}

			for (const optType of Object.keys(optionGroup) as (keyof SetupValues)[]) {
				// had to infer it as SetupOptionKeys or TS will be angry rawr
				const opt = optionGroup[optType as SetupOptionKeys]
				this.props[section][subsection][optType] = this.options[opt]
			}
		}

		return sections
	}

	findSubSectionNode(target: string) {
		const [sectionName, key] = this.checkSectionKey(target)

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

	flattenObject(obj: Setup): Record<string, string> {
		const result: Record<string, string> = {}
		for (const section in obj) {
			if (obj.hasOwnProperty(section)) {
				const inner = obj[section]
				for (const key in inner) {
					if (
						inner.hasOwnProperty(key) &&
						inner[key] &&
						typeof inner[key] === 'object' &&
						'value' in inner[key]
					) {
						// TODO: not sure if outer key that is directional always shares the same inner value
						if (inner[key].value) {
							result[key] = inner[key].value
						}
					}
				}
			}
		}
		return result
	}
}

export default LSP
