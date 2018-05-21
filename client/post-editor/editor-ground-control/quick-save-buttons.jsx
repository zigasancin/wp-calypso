/** @format */
/**
 * External dependencies
 */
import React from 'react';
import { localize } from 'i18n-calypso';
import { get } from 'lodash';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { isPage, isPublished } from 'lib/posts/utils';
import HistoryButton from 'post-editor/editor-ground-control/history-button';
import { recordEvent, recordStat } from 'lib/posts/stats';
import { getSelectedSiteId } from 'state/ui/selectors';
import { getEditorPostId } from 'state/ui/editor/selectors';
import { getEditedPost } from 'state/posts/selectors';

export const isSaveAvailableFn = ( {
	isSaving = false,
	isSaveBlocked = false,
	isDirty = false,
	hasContent = false,
	post = null,
} ) => ! isSaving && ! isSaveBlocked && isDirty && hasContent && !! post && ! isPublished( post );

const QuickSaveButtons = ( {
	isSaving,
	isSaveBlocked,
	isDirty,
	hasContent,
	post,
	translate,
	onSave,
	showRevisions = true,
} ) => {
	const onSaveButtonClick = () => {
		onSave();
		const eventLabel = isPage( post ) ? 'Clicked Save Page Button' : 'Clicked Save Post Button';
		recordEvent( eventLabel );
		recordStat( 'save_draft_clicked' );
	};

	const isSaveAvailable = isSaveAvailableFn( {
		isSaving,
		isSaveBlocked,
		isDirty,
		hasContent,
		post,
	} );

	const showingStatusLabel = isSaving || ( post && post.ID && ! isPublished( post ) );
	const showingSaveStatus = isSaveAvailable || showingStatusLabel;
	const hasRevisions = showRevisions && get( post, 'revisions.length' );

	if ( ! ( showingSaveStatus || hasRevisions ) ) {
		return null;
	}

	return (
		<div className="editor-ground-control__quick-save">
			{ hasRevisions && <HistoryButton /> }
			{ showingSaveStatus && (
				<div className="editor-ground-control__status">
					{ isSaveAvailable && (
						<button
							className="editor-ground-control__save button is-link"
							onClick={ onSaveButtonClick }
							tabIndex={ 3 }
						>
							{ translate( 'Save' ) }
						</button>
					) }
					{ ! isSaveAvailable &&
						showingStatusLabel && (
							<span
								className="editor-ground-control__save-status"
								data-e2e-status={ isSaving ? 'Saving…' : 'Saved' }
							>
								{ isSaving ? translate( 'Saving…' ) : translate( 'Saved' ) }
							</span>
						) }
				</div>
			) }
		</div>
	);
};

QuickSaveButtons.propTypes = {
	isSaving: PropTypes.bool,
	isSaveBlocked: PropTypes.bool,
	isDirty: PropTypes.bool,
	hasContent: PropTypes.bool,
	post: PropTypes.object,
	onSave: PropTypes.func,

	// localize
	translate: PropTypes.func,
};

QuickSaveButtons.defaultProps = {
	hasContent: false,
	isDirty: false,
	isSaveBlocked: false,
	isSaving: false,
	post: null,
};

export default connect( state => {
	const siteId = getSelectedSiteId( state );
	const postId = getEditorPostId( state );
	const post = getEditedPost( state, siteId, postId );

	return { post };
} )( localize( QuickSaveButtons ) );
