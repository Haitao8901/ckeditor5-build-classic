import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TermEditing from './TermEditing'
import TermUI from './TermUI'

export default class Term extends Plugin {
    static get requires() {
        return [ TermEditing, TermUI ];
    }

    static get pluginName() {
		return 'Term';
	}
}