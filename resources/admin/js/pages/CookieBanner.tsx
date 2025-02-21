import {
	Card,
	Title,
	Text,
	Button,
	Divider,
	Group,
	TextInput,
	Select,
	Switch,
	MultiSelect,
	Alert,
	LoadingOverlay,
	Tabs,
	Grid,
	Paper,
	SegmentedControl,
} from '@mantine/core';
import { useEffect, useState } from 'react';
import { runtimeConfig } from '../config';
import { IconInfoCircle } from '@tabler/icons-react';
import { ConsentBannerScreen } from '../components/Consent/ConsentBannerScreen';
import { regulations, finalConsentConfig, themesConfig } from '../utils/utils';
import { BannerTheme } from '../components/Consent/BannerTheme';
import { ButtonTheme } from '../components/Consent/ButtonTheme';
import { UpgradeCard } from '../components/Consent/UpgradeCard';

declare let Cookiex: {
	new (): {
		init: (theme: { domainId: string; domainName: string }) => void;
	};
};

export function CookieBanner() {
	const [domainId, setDomainId] = useState('');
	const [gtmId, setGtmId] = useState('');
	const [gtmEnabled, setGtmEnabled] = useState(false);
	const [language, setLanguage] = useState<any>('en');
	const [loading, setLoading] = useState(true);
	const [autoBlockCookies, setAutoBlockCookies] = useState(false);
	const [cookiePreference, setCookiePreference] = useState<any[]>([]);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [serverCountry, setServerCountry] = useState('in');
	const [languagesAvailable, setLanguagesAvailable] = useState<
		Record<string, string>
	>({
		en: 'English',
		fr: 'Français',
		es: 'Español',
		pt: 'Português',
		ar: 'العربية',
	});
	const [colorScheme, setColorScheme] = useState('Light');
	const [bannerPreview, setBannerPreview] = useState(false);
	const [regulation, setRegulation] = useState<any>(regulations[0]);
	const [consentConfig, setConsentConfig] = useState<any>(finalConsentConfig);

	useEffect(() => {
		if (bannerPreview) {
			generatePreview(regulation, false);
		} else {
			document.querySelector('#cookiex-cc-div')?.remove();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [bannerPreview]);

	useEffect(() => {
		const filteredTheme = themesConfig.filter(
			(theme) => theme.type === colorScheme
		);
		if (consentConfig.theme) {
			consentConfig.theme = filteredTheme[0];
		}
		consentConfig.type = colorScheme;
		generatePreview(regulation, false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [colorScheme]);

	useEffect(() => {
		try {
			setLoading(true);
			runtimeConfig
				.apiFetch({
					path: '/cookiex/v1/settings',
				})
				.then((res: any) => {
					setConsentConfig(res?.theme || finalConsentConfig);
					setDomainId(res.domainId);
					setGtmId(res.gtmId);
					setGtmEnabled(res.gtmEnabled);
					setAutoBlockCookies(res.autoBlockCookies);
					setLanguage(res.language);
					setCookiePreference(res.cookiePreference);
					setServerCountry(res.serverCountry);
					setLanguagesAvailable(res.languagesAvailable);
					setRegulation(res.regulation || regulations[0]);
					setColorScheme(res?.theme.type || 'Light');
				});

			setLoading(false);
		} catch (error) {
			console.error('Failed to fetch settings:', error);
			setLoading(false);
		}
	}, []);

	const validateInputs = () => {
		setErrorMessage('');
		if (!domainId) {
			setErrorMessage('Please enter a valid UUID for the domain ID.');
			return false;
		}
		if (gtmEnabled) {
			if (!gtmId) {
				setErrorMessage('GTM ID cannot be empty when GTM is enabled.');
				return false;
			}
			if (cookiePreference.length === 0) {
				setErrorMessage(
					'Please select at least one cookie preference when GTM is enabled.'
				);
				return false;
			}
		}
		if (!language) {
			setErrorMessage('Please select a primary language.');
			return false;
		}
		setErrorMessage('');
		return true;
	};

	const updateSettings = async () => {
		if (!validateInputs()) {
			return;
		}

		const options = {
			path: '/cookiex/v1/save-settings',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				language,
				autoBlockCookies,
				gtmEnabled,
				gtmId,
				cookiePreference,
				theme: consentConfig,
			}),
		};

		try {
			const response: any = await runtimeConfig.apiFetch(options);
			setSuccessMessage(response);
		} catch (error: any) {
			if ('code' in error && error.code === 'invalid_nonce') {
				setErrorMessage('Security check failed.');
			} else {
				setErrorMessage('Could not save settings');
			}
		}
	};

	const generatePreview = (regulationType: any, initialPreview: boolean) => {
		if (consentConfig.regulation) {
			consentConfig.regulation = regulationType;
		}

		if (bannerPreview) {
			generateHTML(regulationType, initialPreview);
		}
	};

	const handleLayout = (fieldName: any, value: any) => {
		consentConfig[fieldName] = value;
		generatePreview(regulation, false);
	};

	const generateHTML = (regulationType: any, initialPreview: boolean) => {
		const loadExternalScript = (src: any) => {
			return new Promise<void>((resolve, reject) => {
				const script = document.createElement('script');
				script.type = 'text/javascript';
				script.src = src;

				script.onload = () => {
					resolve();
				};

				script.onerror = () => {
					reject(new Error(`Failed to load script ${src}`));
				};

				document.head.appendChild(script);
			});
		};

		setTimeout(function () {
			loadExternalScript(runtimeConfig.previewUrl)
				.then(() => {
					const theme: any = {
						domainId,
						selectorId: 'coookiex-comp-banner-preview',
						theme: {
							layout: consentConfig.layout,
							alignment: consentConfig.alignment,
							theme: consentConfig?.theme,
							bannerContent: consentConfig.bannerContent,
							type: consentConfig.type,
							regulation: regulationType,
						},
						initialPreview,
					};

					const cookiex = new Cookiex();
					cookiex.init(theme);
				})
				.catch((error) => {
					console.error('Error loading external script:', error);
				});
		}, 1000);
	};

	const handleCustomStyles = (colorValue: any, type: any) => {
		const style = `${type}`;
		consentConfig.theme[style] = colorValue;
		generatePreview(regulation, false);
	};

	const handleCustomButtonStyles = (
		colorValue: any,
		buttonType: any,
		type: any
	) => {
		const style = `${buttonType}${type}`;
		consentConfig.theme[style] = colorValue;
		generatePreview(regulation, false);
	};

	return (
		<>
			{loading && (
				<LoadingOverlay
					visible={true}
					zIndex={1000}
					overlayProps={{ radius: 'sm', blur: 2 }}
					loaderProps={{ color: 'green', type: 'bars' }}
				/>
			)}
			{errorMessage && (
				<Alert
					variant="light"
					color="red"
					icon={<IconInfoCircle />}
					mb={10}
				>
					{errorMessage}
				</Alert>
			)}

			{successMessage && (
				<Alert
					variant="light"
					color="green"
					icon={<IconInfoCircle />}
					mb={10}
				>
					{successMessage}
				</Alert>
			)}
			<Tabs
				color="#f1f3f5"
				variant="pills"
				defaultValue="general"
				orientation="vertical"
				p={20}
			>
				<Tabs.List>
					<Tabs.Tab
						p={10}
						style={{ color: '#000', borderRadius: '0px' }}
						value="general"
					>
						General
					</Tabs.Tab>
					<Tabs.Tab
						p={10}
						style={{ color: '#000', borderRadius: '0px' }}
						value="layout"
					>
						Layout
					</Tabs.Tab>
					<Tabs.Tab
						p={10}
						style={{ color: '#000', borderRadius: '0px' }}
						value="content&Colours"
					>
						Color Schemes
					</Tabs.Tab>
				</Tabs.List>
				<div style={{ padding: '20px' }}>
					<Group justify="space-between" mb="lg">
						<Group>
							<Select
								mr={10}
								label="Consent Template"
								placeholder="Choose a regulation"
								allowDeselect={false}
								searchable
								data={regulations.map((reg) => ({
									value: reg.value,
									label: reg.label,
								}))}
								defaultValue={regulation.value}
								onChange={(value) => {
									const selectedRegulation = regulations.find(
										(reg) => reg.value === value
									);
									setRegulation(selectedRegulation);
									generatePreview(selectedRegulation, false);
								}}
							/>
							<Switch
								mt={20}
								label="Banner Preview"
								checked={bannerPreview}
								onChange={(event) =>
									setBannerPreview(
										event.currentTarget.checked
									)
								}
							/>
						</Group>
						<Button color="green" mt="md" onClick={updateSettings}>
							Publish Changes
						</Button>
					</Group>
					<Alert variant="light" color="blue" mb={20}>
						<Text size="sm">{regulation?.description}</Text>
					</Alert>
					<Tabs.Panel value="general" bg="#f1f3f5" p={20}>
						<Grid gutter="lg">
							{/* General Settings */}
							<Grid.Col span={{ base: 12, md: 8, lg: 8 }}>
								<Card
									padding="lg"
									style={{
										display: 'flex',
										flexDirection: 'column',
										minHeight: '300px',
										height: '100%',
									}}
									radius="md"
									withBorder
								>
									<Title order={3}>General Settings</Title>
									<input
										type="hidden"
										name="serverCountry"
										value={serverCountry}
									/>
									<Divider my="md" />
									<Paper p={20}>
										<Group gap="sm" grow>
											<Text size="sm">
												Connect domain ID (UUID)
											</Text>
											<Group grow>
												<TextInput
													value={domainId}
													onChange={(e) =>
														setDomainId(
															e.currentTarget
																.value
														)
													}
													placeholder="E.g. 123e4567-e89b-12d3-a456-426614174000"
												/>
											</Group>
										</Group>
										<Group gap="sm" grow mt="sm">
											<Text size="sm">
												Auto Block Cookies
											</Text>
											<Switch
												checked={autoBlockCookies}
												color="green"
												onChange={(event) =>
													setAutoBlockCookies(
														event.currentTarget
															.checked
													)
												}
												size="sm"
											/>
										</Group>
										<Group gap="sm" grow mt="sm">
											<Text size="sm">Language</Text>
											<Select
												value={language}
												onChange={setLanguage}
												data={Object.entries(
													languagesAvailable
												).map(([code, name]) => ({
													value: code,
													label: name,
												}))}
											/>
										</Group>
										<Divider my="md" />
										<Title order={4}>
											Google Tag Manager
										</Title>
										<Group gap="sm" grow mt="sm">
											<Text size="sm">
												Enable Google Tag Manager
											</Text>
											<Switch
												checked={gtmEnabled}
												color="green"
												onChange={(event) =>
													setGtmEnabled(
														event.currentTarget
															.checked
													)
												}
												size="sm"
											/>
										</Group>
										{gtmEnabled && (
											<>
												<Group gap="sm" grow mt="sm">
													<Text size="sm">
														Enter Google Tag Manager
														ID
													</Text>
													<TextInput
														value={gtmId}
														onChange={(e) =>
															setGtmId(
																e.currentTarget
																	.value
															)
														}
														placeholder="Google Tag Manager ID"
													/>
												</Group>
												<Group gap="sm" grow mt="sm">
													<Text size="sm">
														Choose Google Tag
														Manager cookies
													</Text>
													<MultiSelect
														data={[
															'Preferences',
															'Marketing',
															'Analytics',
														]}
														value={cookiePreference}
														onChange={
															setCookiePreference
														}
													/>
												</Group>
											</>
										)}
									</Paper>
									<div style={{ flexGrow: 1 }}></div>
								</Card>
							</Grid.Col>
						</Grid>
					</Tabs.Panel>
					<Tabs.Panel value="layout" bg="#f1f3f5" p={20}>
						<Grid gutter="lg">
							{/* General Settings */}
							<Grid.Col span={{ base: 12, md: 8, lg: 8 }}>
								<Card
									padding="lg"
									style={{
										display: 'flex',
										flexDirection: 'column',
										minHeight: '300px',
										height: '100%',
									}}
									radius="md"
									withBorder
								>
									<Title order={3}>
										Consent Banner Settings
									</Title>
									<Divider my="md" />
									<ConsentBannerScreen
										handleLayout={handleLayout}
									/>
									<div style={{ flexGrow: 1 }}></div>
								</Card>
							</Grid.Col>
						</Grid>
					</Tabs.Panel>
					<Tabs.Panel value="content&Colours" bg="#f1f3f5" p={20}>
						<Grid>
							{/* General Settings */}
							<Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
								<Card
									padding="lg"
									style={{
										minHeight: '300px',
										height: '100%',
									}}
									radius="md"
									withBorder
								>
									<Title order={3}>Colour scheme</Title>
									<Divider my="md" />
									<SegmentedControl
										color="blue"
										fullWidth
										value={colorScheme}
										onChange={setColorScheme}
										data={[
											{ label: 'Light', value: 'Light' },
											{ label: 'Dark', value: 'Dark' },
											{
												label: 'Custom',
												value: 'Custom',
											},
										]}
										mb="md"
									/>
									<Divider my="md" />
								</Card>
							</Grid.Col>
							<Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
								<UpgradeCard />
							</Grid.Col>
						</Grid>
						{colorScheme === 'Custom' && (
							<Grid>
								<Grid.Col span={{ base: 12, md: 6, lg: 6 }}>
									<Card
										padding="lg"
										style={{
											minHeight: '300px',
											height: '100%',
										}}
										radius="md"
										withBorder
									>
										{colorScheme === 'Custom' && (
											<div>
												<BannerTheme
													customStyles={
														handleCustomStyles
													}
													background={
														consentConfig?.theme
															?.background ||
														'#fff'
													}
													name="background"
													label="Background"
													description=""
												/>
												<BannerTheme
													customStyles={
														handleCustomStyles
													}
													background={
														consentConfig?.theme
															?.textColor ||
														'#000'
													}
													name="textColor"
													label="Text Color"
													description="Choose the color of all texts within the banner"
												/>
												<BannerTheme
													customStyles={
														handleCustomStyles
													}
													background={
														consentConfig?.theme
															?.highlight ||
														'#fff'
													}
													name="highlight"
													label="Highlight"
													description="Choose your highlight color that will impact all links and active toggles in your banner"
												/>
												<Divider my="sm" />
												{regulation.value ===
													'gdpr' && (
													<>
														<Group justify="left">
															<Text size="xs">
																{' '}
																Button 1 (Reject
																All){' '}
															</Text>
														</Group>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonRejectBackGround ||
																'#fff'
															}
															label="BackGround"
															type="buttonReject"
															description=""
														/>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonRejectTextColor ||
																'#000'
															}
															label="TextColor"
															type="buttonReject"
															description=""
														/>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonRejectBorder ||
																'#fff'
															}
															label="Border"
															type="buttonReject"
															description=""
														/>
														<Divider my="sm" />
														<Group justify="left">
															<Text size="xs">
																Button 2
																(Accept){' '}
															</Text>
														</Group>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonAcceptBackGround ||
																'#fff'
															}
															label="BackGround"
															type="buttonAccept"
															description=""
														/>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonAcceptTextColor ||
																'#000'
															}
															label="TextColor"
															type="buttonAccept"
															description=""
														/>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonAcceptBorder ||
																'#fff'
															}
															label="Border"
															type="buttonAccept"
															description=""
														/>
														<Divider my="sm" />
														<Group justify="left">
															<Text size="xs">
																Button 3
																(Customize)
															</Text>
														</Group>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonCustomizeBackGround ||
																'#fff'
															}
															label="BackGround"
															type="buttonCustomize"
															description=""
														/>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonCustomizeTextColor ||
																'#000'
															}
															label="TextColor"
															type="buttonCustomize"
															description=""
														/>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonCustomizeBorder ||
																'#fff'
															}
															label="Border"
															type="buttonCustomize"
															description=""
														/>
													</>
												)}
												{regulation.value === 'us' && (
													<>
														<Group
															justify="left"
															mt={20}
														>
															<Text size="xs">
																{' '}
																Button 1 (Do Not
																Sell My Info){' '}
															</Text>
														</Group>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonRejectBackGround ||
																'#fff'
															}
															label="BackGround"
															type="buttonReject"
															description=""
														/>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonRejectTextColor ||
																'#000'
															}
															label="TextColor"
															type="buttonReject"
															description=""
														/>
														<ButtonTheme
															customStyles={
																handleCustomButtonStyles
															}
															background={
																consentConfig
																	?.theme
																	?.buttonRejectBorder ||
																'#fff'
															}
															label="Border"
															type="buttonReject"
															description=""
														/>
													</>
												)}
											</div>
										)}
									</Card>
								</Grid.Col>
							</Grid>
						)}
					</Tabs.Panel>
				</div>
			</Tabs>
			<div
				style={{ height: '100%', width: '100%', minHeight: '450px' }}
				id="coookiex-comp-banner-preview"
			/>
		</>
	);
}
