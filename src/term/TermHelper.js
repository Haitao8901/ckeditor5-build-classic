import { setTimeout } from "timers";
import EnterObserver from '@ckeditor/ckeditor5-enter/src/enterobserver';

export default class TermHelper {
    constructor(editor){
        this.editor = editor;
        if(!window.Script){
			//for test
			this.serviceUrl = 'http://192.168.0.133:8900/iplatform-ruleeditor/HttpService';
			this.orgid = 'cyberobject';
			this.appid = 'haitaotest';
			if(AutoComplete){
				AutoComplete.init(this.serviceUrl, this.orgid, this.appid);
			}
		}
	}
	
	checkAvailabel(){
		if(AutoComplete){
			//Hide first, will be shown later
			AutoComplete.MenuHide();
			return true;
		}
		console.log('AutoComplete not defined. TermHelper won\'t work.');
		return false;
	}

    queryTermFromServer(term, clickCb){
		if(!this.checkAvailabel()){
			return;
		}
		if (!term) {
			setTimeout(function(){AutoComplete.MenuHide();}, 50);
			return;
		}
		
		const cursorLocation = this.getSelectionCoords(window)
		term = term.replace(/ /g,' ');
		const queryCb = () => {
			if (!AutoComplete.MenuIsShow()){
				var mX = cursorLocation.x;
				var mY = cursorLocation.y + 13;
				AutoComplete.MenuShow(mX, mY);
			}
			this.disableEnter(true);
		}
		const callback = (value, title) => {
			this.disableEnter(false);
			clickCb(value, title);
		}
		AutoComplete.queryDifTerm(term, queryCb, callback);
	}
	
	disableEnter(disable){
		const view = this.editor.editing.view;
		const enterOberver = view.getObserver(EnterObserver);
		if(disable){
			enterOberver.disable();
		}else{
			enterOberver.enable();
		}
	}

    /**Copy from script.html*/
    getSelectionCoords(win) {
	    win = win || window;
	    var doc = win.document;
	    var sel = doc.selection, range, rects, rect;
	    var x = 0, y = 0;
	    if (sel) {
	        if (sel.type != "Control") {
	            range = sel.createRange();
	            range.collapse(true);
	            x = range.boundingLeft;
	            y = range.boundingTop;
	        }
	    } else if (win.getSelection) {
	        sel = win.getSelection();
	        if (sel.rangeCount) {
	            range = sel.getRangeAt(0).cloneRange();
	            if (range.getClientRects) {
	                range.collapse(true);
	                rects = range.getClientRects();
	                if (rects.length > 0) {
	                    rect = rects[0];
	                }
	                // cursor is on the first position，rect=undefined
	                if(rect){
	                    x = rect.left;
	                    y = rect.top;
	                }
	            }
	            // Fall back to inserting a temporary element
	            if ((x == 0 && y == 0) || rect === undefined) {
	                var span = doc.createElement("span");
	                if (span.getClientRects) {
	                    // Ensure span has dimensions and position by
	                    // adding a zero-width space character
	                    span.appendChild( doc.createTextNode("\u200b") );
	                    range.insertNode(span);
	                    rect = span.getClientRects()[0];
	                    x = rect.left;
	                    y = rect.top;
	                    var spanParent = span.parentNode;
	                    spanParent.removeChild(span);
	
	                    // Glue any broken text nodes back together
	                    spanParent.normalize();
	                }
	            }
	        }
	    }
	    return { x: x, y: y };
    }
    
    checkUnknowTerm(term, callback){
		if(!this.checkAvailabel()){
			return;
		}
		AutoComplete.checkUnknowTerm(term, callback);
    }
}