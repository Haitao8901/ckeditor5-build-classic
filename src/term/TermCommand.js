import Command from '@ckeditor/ckeditor5-core/src/command';
import getSelectedContent from '@ckeditor/ckeditor5-engine/src/model/utils/getselectedcontent'

export default class TermCommand extends Command {
    constructor(editor) {
        super(editor);
        this.model = this.editor.model;

    }

    execute(terms) {
        this.model.change(writer => {
            const checkTerms = [];
            for (let i in terms) {
                const termEl = this.insertTerm(terms[i], this.model, writer);
                if (!terms[i].title) {
                    checkTerms.push({term:terms[i], el:termEl});
                }
            }
            // writer.setSelection(this.model.createSelection(terms.pop().end));

            for (let i in checkTerms) {
                this.checkUnknowTerm(checkTerms[i]);
            }
        });
    }

    checkUnknowTerm(checkTerm) {
        const term = checkTerm.term;
        const termEl = checkTerm.el;
        this.model.termHelper.checkUnknowTerm(term.value, (result) => {
            this.model.change(writer => {
                writer.remove(termEl);
                term.title = result;
                term.end = term.start;
                this.insertTerm(term, this.model, writer)
            });
        });
    }

    insertTerm(term, model, writer){
        const termEl = writer.createElement('term', { label: term.label, value: term.value, title: term.title });
        const range = writer.createRange(term.start, term.end);
        writer.remove(range);
        model.insertContent(termEl, term.start);
        return termEl;
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const isAllowed = model.schema.checkChild(selection.focus.parent, 'term');
        this.isEnabled = isAllowed;
    }
}