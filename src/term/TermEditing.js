import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import {viewToModelPositionOutsideModelElement} from '@ckeditor/ckeditor5-widget/src/utils';
import TermCommand from './TermCommand';
import TermHelper from './TermHelper';
import './term.css';

export default class TermEditing extends Plugin {
    constructor(editor){
        super(editor);
        this.editor.model.termHelper = new TermHelper(editor);
    }

    init() {
        this._defineSchema();
        this._defineConverters();
        this.editor.commands.add( 'term', new TermCommand( this.editor ) );

        this.editor.editing.mapper.on(
            'viewToModelPosition',
            viewToModelPositionOutsideModelElement( this.editor.model, viewElement => {return viewElement.hasClass( 'term' ) || viewElement.hasClass( 'term_found' )} )
        );
    }

    _defineSchema() {
        const schema = this.editor.model.schema;
        //<term label='' value='' title=''></term>
        schema.register( 'term', {
			inheritAllFrom: '$text',
			isInline: true,
            allowAttributes: [ 'label', 'value', 'title']
        } );
    }

    _defineConverters() {
        const conversion = this.editor.conversion;

        conversion.for( 'editingDowncast' ).elementToElement( {
            model: 'term',
            view: ( modelItem, viewWriter ) => {
                return createTermView( modelItem, viewWriter );
            }
        } );

        conversion.for( 'dataDowncast' ).elementToElement( {
            model: 'term',
            view: createTermView
        } );

        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'span',
                classes: [ 'term', 'term_found' ]
            },
            model: ( viewElement, modelWriter ) => {
				const name = viewElement.getChild( 0 ).data.slice( 1, -1 );
				const title = modelItem.getAttribute( 'title' );
            	const value = modelItem.getAttribute( 'value' );

                return modelWriter.createElement( 'term', { label:name, title:title, value:value } );
            }
        } );

        function createTermView( modelItem, viewWriter ) {
            const label = modelItem.getAttribute( 'label' );
            const title = modelItem.getAttribute( 'title' );
            const value = modelItem.getAttribute( 'value' );

            const termView = viewWriter.createContainerElement( 'span', {
                class: title ? 'term_found' : 'term',
                value: value,
                title: title,
                contenteditable: false
            } );

			const text = viewWriter.createText(label);
			viewWriter.insert( viewWriter.createPositionAt( termView, 0 ), text );
            return termView;
        }
    }
}