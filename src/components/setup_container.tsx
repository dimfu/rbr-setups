import { SetupValues } from "@/lib/lsp/scanner";

interface SetupNode {
	[key: string]: SetupValues | SetupNode
}

type SetupContainerProps = {
	setup: SetupNode
}

function isSetupValues(value: unknown): value is SetupValues {
	return (
		typeof value === 'object' &&
		value !== null &&
		('value' in value || 'min' in value || 'max' in value || 'step' in value)
	);
}

export default function SetupContainer({ setup }: SetupContainerProps) {
	return (
		<div>
			{Object.entries(setup).map(([key, value]) => (
				<div key={key}>
					<strong>{key}</strong>
					{isSetupValues(value) ? (
						<pre style={{ marginLeft: '20px' }}>
							{JSON.stringify(value, null, 2)}
						</pre>
					) : (
						<div style={{ marginLeft: '20px' }}>
							<SetupContainer setup={value} />
						</div>
					)}
				</div>
			))}
		</div>
	)
}

