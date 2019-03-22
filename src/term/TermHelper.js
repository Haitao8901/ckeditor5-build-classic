
export default class TermHelper {
    constructor(editor){
        this.editor = editor;
        if(window.Script){
           this.serviceUrl = Script.httpServiceUrl;
           this.orgid = 'cyberobject',
           this.appid = 'haitaotest',
        //    this.serviceUrl = Script.httpServiceUrl;
        //    this.orgid = Script.orgid,
        //    this.appid = Script.appid;
           AutoComplete.init(this.serviceUrl, this.orgid, this.appid);
        }
    }

    queryTermFromServer(term, clickCb){
		    if (!term) {
		    	setTimeout(function(){AutoComplete.MenuHide();}, 50);
		        return;
            }
            clickCb('term', 'http://wwww/term/test');
		
			const cursorLocation = getSelectionCoords(window)
		    term = term.replace(/ /g,' ');
		    var queryCb = function () {
		        if (!AutoComplete.MenuIsShow()){
		            var mX = cursorLocation.x;
		            var mY = cursorLocation.y + 13;
		            AutoComplete.MenuShow(mX, mY);
		        }
		    }
		    
		    AutoComplete.queryDifTerm(key, queryCb, clickCb);
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
        var params = {
                orgid: this.orgid,
                appid: this.appid,
                keyword: term
            };
    
            AutoComplete.post(this.httpServiceUrl, {
                'request': JSON.stringify({
                    'header': {
                        'action': 'copyApp.queryDifTerm'
                    },
                    "body": {
                        data:JSON.stringify(params),
                        timeTag:new Date().getTime()
                    }
                })
            }, function (data) {
                if (data.body && data.body.data && data.body.data.status.code == "0000") {
                    var terms = data.body.data.body.terms;
                    for(var i in terms){
                        if(terms[i].lemma == term){
                            callback(terms[i].source);
                            return;
                        }
                    }
                }
            })
    }
}