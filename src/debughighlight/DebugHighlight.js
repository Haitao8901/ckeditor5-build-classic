import Command from '@ckeditor/ckeditor5-core/src/command';
import './debugHighlight.css';
/**
 * This class is used to highlight the specified element(the li html tag in actual html dom).
 * Currently, we only change the css style in view
 */
export default class HightlightCommand extends Command {
    constructor(editor) {
        super(editor);
        this.model = this.editor.model;
        this.view = this.editor.editing.view;
        this.doc = this.view.document;

        //add this to make this comand is always enabled
        //or the highlight won't work when the file is readonly
        this.listenTo( editor, 'change:isReadOnly', ( evt, name, value ) => {
            this.off( 'set:isEnabled');
            this.refresh();
		} );
    }

    execute(data) {//command = {type:$type, path:$path}
        for (const index in data.commands) {
            const command = data.commands[index];
            switch (data.type) {
                case 'highlight': this.highlightElement(command); break;
                case 'remove': this.removeHighlilght(command); break;
                default: break;
            }
        }
    }

    highlightElement(command) {
        this.view.change(writer => {
            const el = this.findTargetElement(command);
            if(!el){
                return;
            }
            
            const childrenCnt = el._children.length;
            const childrenNeedHighlight = this.checkChildrenOfHighlightEl(el);
            const highlightC_cnt = childrenNeedHighlight.length;
            //not contain sub ol/ul
            if(highlightC_cnt == childrenCnt) {
                writer.addClass('debugHighlight', el);
                return;
            }
            
            //need create a div and move the child to it
            //this aimed to make the ui looks better

            //only one child and is a div element
            //1 have been highlight before
            //2 it is a div element originally
            if(highlightC_cnt == 1 && childrenNeedHighlight[0].name == 'div'){
                writer.addClass('debugHighlight', childrenNeedHighlight[0]);
                return;
            }

            const containerEl = writer.createContainerElement( 'div', { class: 'debugHighlight' });
            const positionBefore = writer.createPositionAt(childrenNeedHighlight[0], 'before');
            const positionAfter = writer.createPositionAt(childrenNeedHighlight[highlightC_cnt-1], 'after');
            const range = writer.createRange(positionBefore, positionAfter);
            writer.insert(positionAfter, containerEl);
            writer.move(range, writer.createPositionAt(containerEl, 'end'));

            //scroll to the highlight
            //not work
            // this.view.scrollToTheSelection();
        });
    }

    removeHighlilght(command) {
        this.view.change(writer => {
            const el = this.findTargetElement(command);
            if(!el){
                return;
            }

            const childrenCnt = el._children.length;
            const childrenNeedHighlight = this.checkChildrenOfHighlightEl(el);
            const highlightC_cnt = childrenNeedHighlight.length;
            //not contain sub ol/ul
            if(highlightC_cnt == childrenCnt) {
                writer.removeClass('debugHighlight', el);
                return;
            }

            //if contains sub ol/ul then we must have created a div(the first child) 
            writer.removeClass('debugHighlight', childrenNeedHighlight[0]);
        });
    }

        /**
     * Used to find the sub ul/ol elements to exclude highlight.
     * This may happended when the li contains sub ol/ul element:
     * <li>
     *     <text>xxxxxx</text>
     *     <other>xxxxx</other>
     *     <ul/ol>...</ul/ol>
     * </li>
     * in the above case we only need to highlight the text and other element.
     * 
     * In current iplatform ucx file structure, there can only be one sub ul/ol element
     */
    checkChildrenOfHighlightEl(el) {
        if(!el){
            return null;
        }
        const highlightChildren = Array.from(el._children).filter(child => { 
            //only exclude the ol/ul element
            if(!child.name) {
                return true;
            }
            return !/ol|ul/i.test(child.name) });

        return highlightChildren;
    }

    /**
     * Used to find the sub ul/ol elements to exclude highlight.
     * This may happended when the li contains sub ol/ul element:
     * <li>
     *     <text>xxxxxx</text>
     *     <other>xxxxx</other>
     *     <ul/ol>...</ul/ol>
     * </li>
     * in the above case we only need to highlight the text and other element.
     * 
     * In current iplatform ucx file structure, there can only be one sub ul/ol element
     */
    findExcludeChildren(el) {
        if(!el){
            return null;
        }
        const excludeChildren = Array.from(el._children).filter(child => { 
            //only exclude the ol/ul element
            if(!child.name) {
                return false;
            }
            return /ol|ul/i.test(child.name) });

        return excludeChildren;
    }

    /**
     * Find the target element from current view
    */
    findTargetElement(command) {
        const wholePath = command.path;
        //the root node of all ul and ol elements in current view
        const root = this.doc.roots._items[0];
        // the wholePath format is like below:
        // s1.1-q
        // s1.3-o3-a
        // s1.3-o4-a
        // s1.3.1.1-q
        let paths = wholePath.split('-');
        let targetEL = null;
        while(paths.length != 0) {
            let path = paths.shift();
            if(/^q|a$/i.test(path)) {
                break;
            }
            //start with s, use root
            if(/^s/i.test(path)) {
                path = this.fixPaths(path.replace(/^s/i, ''));
                targetEL = this.findElement(path.split('.'), root, 1);
                continue;
            }
            //if go to here, use the latest found target as root
            if(/^o\d+$/.test(path)) {
                path = this.fixPaths(path.replace(/^o/i, '1.'));
                targetEL = this.findElement(path.split('.'), targetEL, 1);
                continue;
            }
        }
        return targetEL;
        // return this.findHighlightChildren(targetEL);
    }

    /**
     * Fixes the paths to match the dom's structure
     * "1.4.1.2.2.1" will be fixed to "1.4.1.1.1.2.1.2.1.1"
     */
    fixPaths(path){
        const paths = path.split('.');
        for(const index in paths){
            if(index > 1) {
                paths[index] = '1.' + paths[index];
            }
        }
        return paths.join('.');
    }

    /**
     * A method to find the target element
     * @param paths  the elment's path like x.x.x
     * @param node  the root in which we will find the target by param paths
     * @param flag a flag to determin which tag we need to find(Odd number are ol/ul and Even numbers are li)
     */
    findElement(paths, node, flag) {
        //make sure the node is exist
        if(!node) {
            return null;
        }
        const els = Array.from(node._children).filter(child => { 
            if(flag%2 == 0) {
                return /li/i.test(child.name) 
            }
            return /ol|ul/i.test(child.name) });
        
        //not find corresponding elements then return null
        if(!els || els && els.length == 0) {
            return null;
        }

        const index = paths.shift();
        //this is the last index
        if(paths.length == 0) {
            return els[index-1];
        }

        //find in subs
        return this.findElement(paths, els[index-1], ++flag);
    }
}