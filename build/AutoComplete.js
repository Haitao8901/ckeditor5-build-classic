AutoComplete = {};

AutoComplete.init = function (httpServiceUrl,orgid,appid) {
    this.httpServiceUrl = httpServiceUrl;
    this.orgid = orgid;
    this.appid = appid;
    $("body").append('<ul id="AutoCompleteMenu" class="dropdown-menu" style="padding: 0px;overflow:scroll;display:none;width:350px;height:274px;background:#ffffff;font-size:13px"></ul>')
    AutoComplete.shortcutKeyListening();
}

AutoComplete.shortcutKeyListening = function () {
    $(window).keydown(function (e) {
        if (AutoComplete && AutoComplete.MenuIsShow()){
            if (e.keyCode == 37 || e.keyCode == 39 || e.keyCode == 27){
                AutoComplete.MenuHide();
                return;
            }
            AutoComplete.shortcutsManage(e);
        }
    })
}

AutoComplete.setTagValue = function (key, _sel) {
    var sel = AutoComplete.sel;

    if (sel && (sel.tagName == 'TEXTAREA' || sel.tagName == 'INPUT')){
        var startPos = sel.selectionStart;
        var endPos = sel.selectionEnd;
        var tmp = sel.value.substring(0, startPos);
        var _prefix = tmp.substring(0, tmp.lastIndexOf("<"));
        var _suffix = sel.value.substring(endPos, sel.value.length);
        var v = _prefix + '<' + key + '>' + _suffix;
        if (_sel && sel != _sel) sel = _sel;
        sel.value = v;
        sel.selectionStart = _prefix.length + key.length + 2;
        sel.selectionEnd = sel.selectionStart;

    } else if (sel.tagName == 'DIV'){
        var selection = getSelection();
        if (selection.rangeCount == 0) return
        if (AutoComplete.lastEditRange){
            selection.removeAllRanges();
            selection.addRange(AutoComplete.lastEditRange);
        }

        var range = selection.getRangeAt(0);
        var textNode = range.startContainer;
        if (textNode.nodeName != '#text') return;

        var startPos = range.startOffset;
        var endPos = range.endOffset;
        var tmp = textNode.nodeValue.substring(0,startPos);
        var _prefix = tmp.substring(0, tmp.lastIndexOf("<"));
        var v = '<' + key + '>';
        textNode.replaceData(_prefix.length, range.endOffset-_prefix.length, v);
        var tm = _prefix.length + v.length;
        range.setStart(textNode, tm);
        range.collapse(true);
    }
    // sel.focus();
    AutoComplete.sel = sel;
}

AutoComplete.getKeyWord = function (sel) {
    this.sel = sel;
    if (sel && (sel.tagName == 'TEXTAREA' || sel.tagName == 'INPUT')){
        var startPos = sel.selectionStart;
        var endPos = sel.selectionEnd;
        var tmp = sel.value.substring(0, startPos);
        if (tmp.lastIndexOf("<") == -1 || tmp.lastIndexOf("<") < tmp.lastIndexOf(">")) return;
        var _v = tmp.substring(tmp.lastIndexOf("<")+1, tmp.length);
        if (!_v) _v = "*";
        return _v;
    } else if (sel.tagName == 'DIV'){
        var selection = getSelection();
        if (selection.rangeCount == 0) return;
        var range = selection.getRangeAt(0);
        var textNode = range.startContainer;
        if (textNode.nodeName != '#text') return;

        var startPos = range.startOffset;
        var endPos = range.endOffset;
        var tmp = textNode.nodeValue.substring(0,startPos);
        if (tmp.lastIndexOf("<") == -1 || tmp.lastIndexOf("<") < tmp.lastIndexOf(">")) return;
        var _v = tmp.substring(tmp.lastIndexOf("<")+1, tmp.length);
        if (!_v) _v = "*";

        this.lastEditRange = range;
        console.log(_v);
        return _v;
    }
}

AutoComplete.contentVerify = function (content) {
    if (!content || content.lastIndexOf('<') == -1) return false;
    if (this.content && this.content == content && AutoComplete.MenuIsShow()) return false;
    this.content = content;
    return true;
}

AutoComplete.MenuIsShow = function () {
    return $('#AutoCompleteMenu').is(':visible')
}

AutoComplete.get = function () {
    return $('#AutoCompleteMenu')
}

AutoComplete.MenuShow = function (x,y) {
    $("#AutoCompleteMenu").css("left",x+"px");
    $("#AutoCompleteMenu").css("top",y+"px");
    $("#AutoCompleteMenu").show();
    $("#AutoCompleteMenu").scrollTop(0);
}

AutoComplete.MenuHide = function () {
    $("#AutoCompleteMenu").hide();
    delete AutoComplete.keyword;
    delete AutoComplete.sel;
    delete AutoComplete.lastEditRange;
    $("#AutoCompleteMenu").empty();
}

AutoComplete.queryDifTerm = function (keyword, queryCb, clickCb) {
    if (this.keyword && this.keyword == keyword && AutoComplete.MenuIsShow()){
        return;
    }
    var timeTag = (new Date()).getTime();
    if (AutoComplete.timeTag && AutoComplete.timeTag > timeTag) return;
    this.keyword = keyword;
    this.queryCb = queryCb;
    this.clickCb = clickCb;

    var params = {
        orgid: this.orgid,
        appid: this.appid,
        keyword: keyword
    };

    AutoComplete.post(this.httpServiceUrl, {
        'request': JSON.stringify({
            'header': {
                'action': 'copyApp.queryDifTerm'
            },
            "body": {
                data:JSON.stringify(params),
                timeTag:timeTag
            }
        })
    }, function (data) {
        if (data.body && data.body.data && data.body.data.status.code == "0000") {
            if (AutoComplete.timeTag && AutoComplete.timeTag > data.body.timeTag) return;
            AutoComplete.timeTag = data.body.timeTag;
            processAutoSelectResponse(data.body.data.body.terms, keyword);
        }
    })
}

AutoComplete.checkUnknowTerm = function(term, callback){
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

AutoComplete.shortcutsManage = function (event) {
    if (event.keyCode != 40 && event.keyCode != 38 && event.keyCode != 13) return;

    event.preventDefault();
    event.stopPropagation();

    var ul = $("#AutoCompleteMenu");
    var currentLine = -1;
    var length = $(ul).children().length;

    for (var i = 0; i < length; i++) {
        var li = ul.children()[i];
        if ($(li).css("background-color") == "rgb(235, 235, 235)"){
            if (event.keyCode == 13){
                var v = $(li).attr('tag');
                AutoComplete.clickCb(v, $(li).attr('title'));
                // AutoComplete.setTagValue(v);
                AutoComplete.MenuHide();
                return true;
            } else {
                currentLine = i;
                $(li).css("background-color", "");
            }
            break;
        }
    }
    if (event.keyCode == 38) {
        if (currentLine == -1 || currentLine == 0) {
            currentLine = length - 1;
        } else {
            currentLine--;
        }
    }
    if (event.keyCode == 40) {
        if (currentLine == -1 || currentLine == length-1) {
            currentLine = 0;
        } else {
            currentLine++;
        }
    }
    console.log(currentLine);
    $(ul.children()[currentLine]).css("background-color", "rgb(235, 235, 235)");


    var f = 18;
    var liHeight = (currentLine + 1) * f;
    var ul = $("#AutoCompleteMenu");
    var ulST = ul.scrollTop(), toST = 0, roll = true;

    if (liHeight - f <= ulST){
        toST = liHeight - f;
    } else if (ulST + ul.height() <= liHeight){
        toST = ulST + liHeight - ulST - ul.height() + f;
    } else {
        roll = false;
    }
    if (roll) ul.scrollTop(toST);

    return true;
}

function processAutoSelectResponse(terms, _words) {
    var ul = $("#AutoCompleteMenu");
    ul.empty();
    var text = "";
    var words = _words;
    if (_words == '*') words = '';
    for (var i = 0; i < terms.length; i++) {
        var term = terms[i];
        var source = term.source;
        var lemma = term.lemma;
        if (lemma){
            text += buildColorLi(term, words);
            // ul.append(buildColorLi(term, words));
            // ul.find("li:last span:first").tooltip({"placement":"top","html":true, "title":source,"delay": "3000"});
        }
    }
    ul.append(text);

    if(ul.children().length == 0){
        if(AutoComplete.MenuIsShow()) AutoComplete.MenuHide();
        return;
    } else {
        $("#AutoCompleteMenu li").click(function () {
            var v = $(this).attr('tag');
            AutoComplete.clickCb(v, $(this).attr('title'));
            AutoComplete.MenuHide();
            // AutoComplete.setTagValue(v);
        });

        // 悬浮效果
        $("#AutoCompleteMenu li").hover(function(event) {
            if (event.type == "mouseenter"){
                $(this).siblings().css({"background-color":"","cursor":""});
                $(this).css({"background-color":"rgb(235,235,235)","cursor":"pointer"});
            } else if (event.type == "mouseleave"){
                $(this).css({"background-color":"","cursor":""});
            }
        });
        $(ul.children()[0]).css("background-color", "rgb(235,235,235)");
        if (!AutoComplete.keyword || AutoComplete.keyword != _words){
            ul.empty();
        } else {
            AutoComplete.queryCb();
        }

    }


}

function buildColorLi(term, words) {
    if (!term.lemma) return;
    var lemma = term.lemma;
    var uri = term.uri==undefined?"":(", "+term.uri);
    var source = term.source;


    var idx = lemma.toUpperCase().indexOf(words.toUpperCase());
    var prefix = lemma.substr(0, idx);
    var suffix = lemma.substr(idx + words.length);
    var word = lemma.substr(idx, words.length);
    var format = term.format==undefined?"":term.format;
    // lemma = lemma.replace(/'/g,"\\'");
    return '<li data-toggle="tooltip" data-placement="bottom" title="'+source+'" tag="'+lemma+'" style="height:18px;"><span >' +
        '<STRONG style="white-space: nowrap;position: relative;left: 15px;">' + prefix + '<span style="color:red;">' + word + '</span>' + suffix +'</STRONG>' +
        '<span style="font-style:italic;white-space: nowrap;position: relative;left: 15px;">'+uri+'</span></span></li>';
}

AutoComplete.post = function(url, params, success, error) {

    $.ajax({
        type : 'POST',
        url : url,
        cache : false,
        data : params,
        dataType : "json",
        success : function(data) {
            success(data);
        },
        error : function(XMLHttpRequest, textStatus, errorThrown) {
        }
    });
};
