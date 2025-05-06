interface Setup {
	[key: string]: string | Setup;
}

type SetupContainerProps = {
	setup: Setup;
};

export default function SetupContainer({ setup }: SetupContainerProps) {
	return (
		<div>
			{Object.entries(setup).map(([key, value]) => (
				<div key={key}>
					<strong>{key}</strong>
					{typeof value === 'object' && value !== null ? (
						<div style={{ marginLeft: '20px' }}>
							<SetupContainer setup={value} />
						</div>
					) : (
						<span>: {value}</span>
					)}
				</div>
			))}
		</div>
	);
}

