import Command from '@ckeditor/ckeditor5-core/src/command';
import getSelectedContent from '@ckeditor/ckeditor5-engine/src/model/utils/getselectedcontent'

export default class TermCommand extends Command {
    constructor(editor) {
        super(editor);
        this.model = this.editor.model;

    }

    execute(terms) {
        const model = this.editor.model;
        const _this = this;
        model.change(writer => {
            for (let i in terms) {
                const term = terms[i];
                const termEl = writer.createElement('term', { label: term.label, title: term.value });
                const range = writer.createRange(term.start, term.end);
                writer.remove(range);
                model.insertContent(termEl, model.document.selection);
                if (!term.title) {
                    _this.checkUnknowTerm(term.label, termEl);
                }
            }
        });
    }

    checkUnknowTerm(label, modelElement) {
        this.model.termHelper.checkUnknowTerm(label, (result) => {
            model.change(writer => {
                termEl.setAttribute(title, result);
            });
        });
    }

    refresh() {
        const model = this.editor.model;
        const selection = model.document.selection;
        const isAllowed = model.schema.checkChild(selection.focus.parent, 'term');
        this.isEnabled = isAllowed;
    }
}