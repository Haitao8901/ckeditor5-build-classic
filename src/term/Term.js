import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import TermEditing from './TermEditing'
import TermUI from './TermUI'
import TermChecking from './TermChecking';

export default class Term extends Plugin {
    static get requires() {
        return [ TermEditing, TermChecking ];
    }

    static get pluginName() {
		return 'Term';
	}
}