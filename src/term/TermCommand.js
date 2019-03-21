import Command from '@ckeditor/ckeditor5-core/src/command';

export default class TermCommand extends Command {
    execute( { value } ) {
		const model = this.editor.model;
		const document = model.document;
		const selection = document.selection;

        model.change( writer => {
            // Create <placeholder> elment with name attribute...
			const term = writer.createElement( 'term', { label: value, value: value, title:value } );
			
			// editor.model.deleteContent(selection, {leaveUnmerged = true});
            // ... and insert it into the document.
            model.insertContent( term ,selection);

            // Put the selection on inserted element.
            writer.setSelection( term, 'on' );
        } );
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const isAllowed = model.schema.checkChild( selection.focus.parent, 'term' );
        this.isEnabled = isAllowed;
    }
}