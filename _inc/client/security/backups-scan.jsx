/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import analytics from 'lib/analytics';
import get from 'lodash/get';
import { getPlanClass } from 'lib/plans/constants';

/**
 * Internal dependencies
 */
import { FEATURE_SECURITY_SCANNING_JETPACK } from 'lib/plans/constants';
import {
	ModuleSettingsForm as moduleSettingsForm,
} from 'components/module-settings/module-settings-form';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import { getVaultPressData, isFetchingVaultPressData } from 'state/at-a-glance';
import { getSitePlan, isFetchingSiteData } from 'state/site';
import includes from 'lodash/includes';

export const BackupsScan = moduleSettingsForm(
	class extends Component {
		toggleModule = ( name, value ) => {
			this.props.updateFormStateOptionValue( name, ! value );
		};

		trackConfigureClick = () => {
			analytics.tracks.recordJetpackClick( 'configure-scan' );
		};

		getCardText() {
			const backupsEnabled = get( this.props.vaultPressData, [ 'data', 'features', 'backups' ], false ),
				scanEnabled = get( this.props.vaultPressData, [ 'data', 'features', 'security' ], false ),
				planClass = getPlanClass( this.props.sitePlan.product_slug );
			let cardText = '';

			if ( this.props.isFetchingSiteData || this.props.isFetchingVaultPressData ) {
				return __( 'Checking site status…' );
			}

			if ( this.props.isDevMode ) {
				return __( 'Unavailable in Dev Mode.' );
			}

			// We check if the features are active first, rather than the plan because it's possible the site is on a
			// VP-only plan, purchased before Jetpack plans existed.
			if ( backupsEnabled && scanEnabled ) {
				return __( 'Your site is backed up and threat-free.' );
			}

			// Only return here if backups enabled and site on on free/personal plan.  If they're on a higher plan,
			// then they have access to scan as well, and need to set it up!
			if ( backupsEnabled && includes( [ 'is-free-plan', 'is-personal-plan' ], planClass ) ) {
				return __( 'Your site is backed up.' );
			}

			// Nothing is enabled. We can show upgrade/setup text now.
			switch ( planClass ) {
				case 'is-personal-plan':
					cardText = __( "You have paid for backups but they're not yet active." );
					cardText += ' ' + __( 'Click "Set Up" to finish installation.' );
					break;
				case 'is-premium-plan':
				case 'is-business-plan':
					cardText = __( 'You have paid for backups and security scanning but they’re not yet active.' );
					cardText += ' ' + __( 'Click "Set Up" to finish installation.' );
					break;
			}

			return cardText;
		}

		render() {
			const scanEnabled = get( this.props.vaultPressData, [ 'data', 'features', 'security' ], false ),
				backups = {
					module: 'backups',
					name: __( 'Backups', { comment: 'A module name' } ),
					learn_more_button: 'https://help.vaultpress.com/get-to-know/'
				};
			return (
				<SettingsCard
					feature={ FEATURE_SECURITY_SCANNING_JETPACK }
					{ ...this.props }
					header={ __( 'Backups and security scanning', { context: 'Settings header' } ) }
					action="scan"
					hideButton>
					<SettingsGroup
						disableInDevMode
						module={ backups }>
						{
							this.getCardText()
						}
					</SettingsGroup>
					{
						( ! this.props.isUnavailableInDevMode( 'backups' ) && scanEnabled ) && (
							<Card compact className="jp-settings-card__configure-link" onClick={ this.trackConfigureClick } href="https://dashboard.vaultpress.com/">{ __( 'Configure your Security Scans' ) }</Card>
						)
					}
				</SettingsCard>
			);
		}
	}
);

export default connect( state => {
	return {
		sitePlan: getSitePlan( state ),
		isFetchingSiteData: isFetchingSiteData( state ),
		vaultPressData: getVaultPressData( state ),
		isFetchingVaultPressData: isFetchingVaultPressData( state ),
	};
} )( BackupsScan );
