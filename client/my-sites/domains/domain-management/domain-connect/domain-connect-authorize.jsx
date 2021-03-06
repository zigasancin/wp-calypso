/** @format */

/**
 * External dependencies
 */

import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { localize } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import CompactCard from 'components/card/compact';
import Main from 'components/main';
import Notice from 'components/notice';
import DomainConnectAuthorizeDescription from './domain-connect-authorize-description';
import DomainConnectAuthorizeRecords from './domain-connect-authorize-records';
import DomainConnectAuthorizeFooter from './domain-connect-authorize-footer';
import { actionType, noticeType } from './constants';
import wp from 'lib/wp';

const wpcom = wp.undocumented();

class DomainConnectAuthorize extends Component {
	static propTypes = {
		providerId: PropTypes.string.isRequired,
		serviceId: PropTypes.string.isRequired,
	};

	state = {
		action: null,
		dnsTemplateRecordsRetrieved: false,
		dnsTemplateError: false,
		noticeType: null,
	};

	componentDidMount() {
		const { providerId, serviceId, params, translate } = this.props,
			{ domain } = params;

		wpcom
			.getDnsTemplateRecords( domain, providerId, serviceId, params )
			.then(
				data => {
					this.setState( {
						action: actionType.READY_TO_SUBMIT,
						dnsTemplateConflicts: data && data.conflicting_records,
						dnsTemplateRecords: data && data.new_records,
					} );
				},
				error => {
					const errorMessage =
						error.message ||
						translate(
							"We aren't able to set up the service with the information given. Please check " +
								'with your service provider to make sure they provided all the correct data.'
						);

					this.setState( {
						action: actionType.CLOSE,
						noticeType: noticeType.ERROR,
						noticeMessage: errorMessage,
						dnsTemplateError: true,
					} );
				}
			)
			.then( () => {
				this.setState( {
					dnsTemplateRecordsRetrieved: true,
				} );
			} );
	}

	handleClickConfirm = () => {
		const { providerId, serviceId, params, translate } = this.props,
			{ domain } = params;

		this.setState( {
			action: actionType.SUBMITTING,
			noticeType: null,
		} );

		wpcom.applyDnsTemplateSyncFlow( domain, providerId, serviceId, params ).then(
			result => {
				if ( result.redirect_uri ) {
					window.location.assign( result.redirect_uri );
				}
				this.setState( {
					action: actionType.CLOSE,
					noticeMessage: translate( 'Hurray! Your new service is now all set up.' ),
					noticeType: noticeType.SUCCESS,
				} );
			},
			error => {
				const errorMessage =
					error.message ||
					translate(
						"We weren't able to add the DNS records needed for this service. Please try again."
					);

				this.setState( {
					action: actionType.READY_TO_SUBMIT,
					noticeMessage: errorMessage,
					noticeType: noticeType.ERROR,
				} );
			}
		);
	};

	handleClickClose = () => {
		window.close();
	};

	renderNotice = () => {
		if ( this.state.noticeType ) {
			return (
				<Notice
					showDismiss={ false }
					status={ this.state.noticeType }
					text={ this.state.noticeMessage }
				/>
			);
		}

		return null;
	};

	render() {
		const { params, translate } = this.props,
			{ domain } = params;

		return (
			<Main className="domain-connect__main">
				<CompactCard>
					<h2>
						{ translate( 'Authorize DNS Changes for %(domain)s', {
							args: { domain: domain },
							comment:
								'%(domain)s is the domain name that we are requesting the user to authorize changes to.',
						} ) }
					</h2>
					<DomainConnectAuthorizeDescription
						isPlaceholder={ ! this.state.dnsTemplateRecordsRetrieved }
						providerId={ this.props.providerId }
						dnsTemplateError={ this.state.dnsTemplateError }
					/>
					<DomainConnectAuthorizeRecords
						domain={ domain }
						dnsTemplateRecords={ this.state.dnsTemplateRecords }
						dnsTemplateConflicts={ this.state.dnsTemplateConflicts }
						isPlaceholder={ ! this.state.dnsTemplateRecordsRetrieved }
					/>
					{ this.renderNotice() }
				</CompactCard>
				<CompactCard>
					<DomainConnectAuthorizeFooter
						isPlaceholder={ ! this.state.dnsTemplateRecordsRetrieved }
						onClose={ this.handleClickClose }
						onConfirm={ this.handleClickConfirm }
						showAction={ this.state.action }
					/>
				</CompactCard>
			</Main>
		);
	}
}

export default localize( DomainConnectAuthorize );
