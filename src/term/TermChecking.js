import Plugin from '@ckeditor/ckeditor5-core/src/plugin';

export default class TermChecking extends Plugin{
	constructor( editor) {
        super(editor);
        this.model = this.editor.model;
        this.document = this.model.document;
    }

    init(){
        this.editor.editing.view.document.on( 'mutations', this.checkMutations );
        this.listenTo( this.model, '_afterChanges', this.checkTerm.bind(this), { priority: 'lowest' } );
    }

    checkMutations(evt, mutations, viewSelection ){
        // console.log(mutations[0]);
    }

    checkTerm(){
        const selection = this.document.selection;
        if(selection.rangeCount > 1){
            return;
        }
        const range = selection.getFirstRange();
        if(!range.isCollapsed){
            return;
        }

        if(this.checkFullTerm()){
            return;
        }

        this.checkTermPrefix();
    }

    checkFullTerm(){
        const range =  this.document.selection.getFirstRange();
        const model = this.model;
        const position = range.start;
        const root = position.root;
        let nodeAfter,nodeBefore;
        let textNode = position.textNode;

        const checkingText = {
            before:'', 
            normal:'', 
            after:'',
            merge:function(){
                return this.before + this.normal + this.after;
            }
        };
        
        //cursor in text node, then nodeBefore and nodeAfter is null
        if(textNode){
            checkingText.normal = textNode._data;
            nodeBefore = textNode.previousSibling;
            nodeAfter = textNode.nextSibling;
        }else{
            nodeAfter = position.nodeAfter;
            nodeBefore = position.nodeBefore;
        }

        while(nodeAfter && nodeAfter.is('text')){
            checkingText.after += nodeAfter._data;
            nodeAfter = nodeAfter.nextSibling;
        }

        while(nodeBefore && nodeBefore.is('text')){
            checkingText.before += nodeBefore._data;
            nodeBefore = nodeBefore.previousSibling;
        }

        let basePath = position.path.slice();
        basePath.pop();
        let needAddedOffset = 0;       
        //if exist, this mustn't be a textnode element
        if(nodeBefore){
            const nbposition = model.createPositionAfter(nodeBefore);
            needAddedOffset = nbposition.path.pop();
        }

        //pureText of all the textnode near the cursor
        const pureText = checkingText.merge();
        const terms = [];
        const _this = this;

        let foundTermsLength = 0;
        let order = 0;
        pureText.replace(/<[^<>]+>/ig, function(term, index){
            console.log(term + '---' + index);
            
            index = index - foundTermsLength + (order++);
            foundTermsLength += term.length;
            
            const start = model.createPositionFromPath(root, _this.getPathArray(basePath, index, needAddedOffset));
            const end = model.createPositionFromPath(root, _this.getPathArray(basePath, index + term.length, needAddedOffset));
            const value = term.substring(1, term.length-1);//remove the '<' and '>'
            terms.push({
                start:start,
                length:term.length,
                end: end,
                label:term,
                value:value,
                title:''
            });

        });
        if(terms.length == 0){
            return false;
        }
        this.insertFullTerm(terms);
        return true;
    }

    /**
     * Not contain any well formated term then check if ther exist a term prefix '<...'
     */
    checkTermPrefix(){
        const range =  this.document.selection.getFirstRange();
        const model = this.model;
        const position = range.start;
        const root = position.root;
        let nodeBefore;
        let textNode = position.textNode;

        const checkingText = {
            before:'', 
            normal:'', 
            merge:function(){
                return this.before + this.normal;
            }
        };
        
        //cursor in text node, then nodeBefore and nodeAfter is null
        if(textNode){
            checkingText.normal = textNode._data;
            nodeBefore = textNode.previousSibling;
        }else{
            nodeBefore = position.nodeBefore;
        }

        while(nodeBefore && nodeBefore.is('text')){
            checkingText.before += nodeBefore._data;
            nodeBefore = nodeBefore.previousSibling;
        }

        let basePath = position.path.slice();
        const cursorPosition = basePath.pop();
        let needAddedOffset = 0;       
        //if exist, this mustn't be a textnode element
        if(nodeBefore){
            const nbposition = model.createPositionAfter(nodeBefore);
            needAddedOffset = nbposition.path.pop();
        }

        //pureText of all the textnode near the cursor
        const pureText = checkingText.merge().substring(0, cursorPosition-needAddedOffset);
        const _this = this;
        pureText.replace(/<[^<]*/ig, function(term, index){
            console.log(term + '---' + index);

            const start = model.createPositionFromPath(root, _this.getPathArray(basePath, index, needAddedOffset));
            const end = model.createPositionFromPath(root, _this.getPathArray(basePath, index + term.length, needAddedOffset));
            term = term.substring(1);
            _this.editor.model.termHelper.queryTermFromServer(term ? term : '*', function(value, title){
                _this.insertFullTerm({
                    start:start,
                    length:term.length,
                    end: end,
                    label:'<' + value + '>',
                    value:value,
                    title: title
                });
            });
        });
    }

    getPathArray(base, offset, add){
        const temp = base.slice();
        temp.push(offset + add);
        return temp;
    }

    insertFullTerm(terms){
        this.editor.execute('term', [].concat(terms));
    }
}