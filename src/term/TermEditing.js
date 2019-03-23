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
        //model format: <term label='' value='' title=''></term>
        //view format: <span title='$title' value='$value'>$label</span>
        //label = '<' + value + '>'
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

        /**
         * below is not work(will find why in the future): 
           view: {
                name: 'span',
                classes: ['term', 'term_found']
            }
            so divide the classses into two upcast
        */
        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'span',
                classes: 'term'
            },
            model: ( viewElement, modelWriter ) => {
				const label = viewElement.getChild( 0 ).data;
				const title = viewElement.getAttribute( 'title' );
            	const value = viewElement.getAttribute( 'value' );
                return modelWriter.createElement( 'term', { label:label, title:title, value:value } );
            }
        } );

        conversion.for( 'upcast' ).elementToElement( {
            view: {
                name: 'span',
                classes: 'term_found'
            },
            model: ( viewElement, modelWriter ) => {
				const label = viewElement.getChild( 0 ).data;
				const title = viewElement.getAttribute( 'title' );
            	const value = viewElement.getAttribute( 'value' );
                return modelWriter.createElement( 'term', { label:label, title:title, value:value } );
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