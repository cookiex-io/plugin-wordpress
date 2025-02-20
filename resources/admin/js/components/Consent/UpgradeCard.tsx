import { Card, Title, Text, Button, Anchor } from '@mantine/core';
import { runtimeConfig } from '../../config';

function UpgradeCard() {
	const openCMP = () => {
		window.open(
			runtimeConfig.cmpRedirectUrl,
			'_blank',
			'noopener,noreferrer'
		);
	};

	return (
		<Card
			shadow="sm"
			padding="lg"
			radius="md"
			withBorder
			style={{ textAlign: 'center' }}
		>
			<Title order={4} mt="xs">
				Upgrade to unlock custom CSS and other advanced features
			</Title>

			<Text size="sm" mt="xs" color="dimmed">
				To upgrade, create a new Cookiex account, or connect to an
				existing account and access premium features! After connecting,
				you can manage all your settings from the web app.
			</Text>

			<Button fullWidth mt="md" color="green" onClick={openCMP}>
				New? Create an Account
			</Button>

			<Text size="sm" mt="xs" onClick={openCMP}>
				Already have an account?{' '}
				<Anchor href="#" size="sm" color="blue">
					Connect your existing account
				</Anchor>
			</Text>
			<div style={{ flexGrow: 1 }}></div>
		</Card>
	);
}

export { UpgradeCard };
