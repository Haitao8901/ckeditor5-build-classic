
export default class TermChecking{
	constructor( editor) {
        this.editor = editor;
        this.model = this.editor.model;
		this.document = model.document;
    }

    init(){
        this.editor.editing.view.document.on( 'mutations', this.checkForTyping );
    }

    checkForTyping(evt, mutations, viewSelection ){
        
    }
}