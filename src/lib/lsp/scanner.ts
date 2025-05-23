enum TokenKinds {
	List = "LIST",
	EndOfList = "END_OF_LIST",
	OpenParen = 'OPEN_PAREN',
	ClosedParen = 'CLOSED_PAREN',
	Identifier = 'IDENTIFIER',
	Key = 'KEY',
	Value = 'VALUE',
	String = "STRING",
	Plus = "PLUS",
	Minus = "MINUES",
	EOF = "EOF",
}

type TokenType = `${TokenKinds}`;

interface TokenAt {
	line: number
	column: number
	index: number
}

interface SyntaxNode {
	type?: TokenKinds
	literal?: unknown
	list?: SyntaxNode[]
	tokenAt: TokenAt
}

interface SetupValues {
	max?: string
	min?: string
	step?: string
	value?: string
}

type Setup = Record<string, Record<string, SetupValues>>

class Token {
	type: TokenType
	value?: string
	literal?: unknown

	constructor(type: TokenType, literal?: unknown, value?: string) {
		this.type = type
		this.literal = literal
		this.value = value
	}
}

class Scanner {
	start = 0
	current = 0
	line = 1
	currentToken: Token
	source: string = ""
	nodes: SyntaxNode[] = []

	constructor(source: string) {
		this.source = source
		// get current token after initialization
		if (source.length > 0) {
			this.currentToken = this.scanToken()
		} else {
			this.currentToken = new Token(TokenKinds.EOF)
		}
	}

	get length() {
		return this.source.length
	}

	scanToken(): Token {
		if (this.isAtEnd()) {
			return new Token(TokenKinds.EOF)
		}

		// move the start pointer to the correct position
		this.start = this.current
		const char = this.advance()

		switch (char) {
			case '(':
				return new Token(TokenKinds.OpenParen)
			case ')':
				return new Token(TokenKinds.ClosedParen)
			case '"':
				return new Token(TokenKinds.String, this.readString())
			default:
				if (this.isDigit(char)) {
					return new Token(TokenKinds.Value, this.readNumber())
				} else if (this.isAlpha(char)) {
					return new Token(TokenKinds.Identifier, this.readIdentifier())
				} else if (this.isWhitespace(char)) {
					if (char === '\n') {
						this.line++
					}
					return this.scanToken()
				} else {
					// look for expected token instead
					return this.scanToken()
				}
		}
	}

	parseExpression(token: Token): SyntaxNode {
		const node: SyntaxNode = {
			tokenAt: {
				line: this.line,
				column: this.current - this.start,
				index: this.start
			}
		}
		this.currentToken = this.scanToken()

		switch (token.type) {
			// every open parentheses will create a children/list inside the current node
			case TokenKinds.OpenParen:
				node.type = TokenKinds.List
				const children: SyntaxNode[] = []
				while (this.currentToken.type !== TokenKinds.ClosedParen && this.currentToken.type !== TokenKinds.EOF) {
					children.push(this.parseExpression(this.currentToken))
				}
				// consume the closed parentheses
				this.currentToken = this.scanToken()
				node.list = children
				return node

			case TokenKinds.Identifier:
				node.type = TokenKinds.Identifier
				node.literal = token.literal
				return node

			// skip string until we found expected tokens
			case TokenKinds.String:
				return this.parseExpression(this.currentToken)

			case TokenKinds.Value:
				node.type = TokenKinds.Value
				node.literal = token.literal
				return node

			default:
				throw new Error(`Invalid start of SyntaxNode token ${token.type} at line ${node.tokenAt.line}`)
		}
	}

	// parses the entire source text until end of file
	parse(): Setup {
		const syntaxTree: SyntaxNode[] = []
		while (this.peekToken().type !== TokenKinds.EOF) {
			syntaxTree.push(this.parseExpression(this.currentToken))
		}
		const root = (syntaxTree[0]?.list?.[0].list ?? []) as SyntaxNode[]
		this.nodes = root
		return this.buildTopLevelMap(root)
	}

	// generate key value map only from identifier followed by list
	buildTopLevelMap(root: SyntaxNode[]): Setup {
		const result: Record<string, Record<string, SetupValues>> = {}
		const items = root ?? []

		for (let i = 0; i < items.length - 1; i += 2) {
			const keyNode = items[i]
			const valueList = items[i + 1]

			if (keyNode?.type === 'IDENTIFIER' && valueList?.type === 'LIST') {
				const sectionName = String(keyNode.literal)
				result[sectionName] = this.pairIdentifiersWithValues(valueList.list ?? [])
			}
		}

		return result
	}

	pairIdentifiersWithValues(nodes: SyntaxNode[]): Record<string, SetupValues> {
		const result: Record<string, SetupValues> = {}

		for (let i = 0; i < nodes.length - 1; i++) {
			const keyNode = nodes[i]
			const valueNode = nodes[i + 1]

			// pair identifier with value only, not including single identifier without value
			if (keyNode?.type === 'IDENTIFIER' && valueNode?.type === 'VALUE') {
				const key = String(keyNode.literal)
				const value = String(valueNode.literal)
				result[key] = {
					value
				}
				i++ // skip value node
			}
		}

		return result
	}

	readIdentifier(): string {
		while (this.isAlphanumeric(this.peek())) {
			this.advance()
		}
		return this.source.substring(this.start, this.current)
	}

	readNumber(): string {
		while (this.isDigit(this.peek())) {
			this.advance()
		}
		if (this.peek() === '.' && this.isDigit(this.peekNext())) {
			this.advance()
			while (this.isDigit(this.peek())) {
				this.advance()
			}
		}
		return this.source.substring(this.start, this.current)
	}

	readString(): string {
		while (this.peek() !== '"' && !this.isAtEnd()) {
			if (this.peek() === '\n') this.line++
			this.advance()
		}
		if (this.isAtEnd()) {
			throw new Error("Unterminated string")
		}
		this.advance()
		return this.source.substring(this.start, this.current - 1)
	}

	advance(): string {
		this.current++
		return this.source[this.current - 1]
	}

	match(char: string): boolean {
		if (this.isAtEnd()) return false
		if (char !== this.source[this.current]) return false
		this.current++
		return true
	}

	peekToken(): Token {
		return this.currentToken
	}

	peek(): string {
		if (this.isAtEnd()) return ""
		return this.source[this.current]
	}

	peekNext(): string {
		if (this.current + 1 >= this.length) return ""
		return this.source[this.current + 1]
	}

	isWhitespace(char: string): boolean {
		return char === ' ' || char === '\r' || char === '\t' || char === '\n'
	}

	isAlphanumeric(char: string) {
		return this.isAlpha(char) || this.isDigit(char)
	}

	isAlpha(char: string) {
		const code = char.charCodeAt(0)
		return (code >= 65 && code <= 90) || (code >= 97 && code <= 122) || code === 95
	}

	isDigit(char: string) {
		const code = char.charCodeAt(0)
		return code >= 48 && code <= 57
	}

	isAtEnd(): boolean {
		return this.current >= this.length
	}
}

export type { SyntaxNode, Setup, SetupValues }
export { Token, TokenKinds, Scanner }
