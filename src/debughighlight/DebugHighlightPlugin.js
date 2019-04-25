import Plugin from '@ckeditor/ckeditor5-core/src/plugin';
import HightlightCommand from './DebugHighlight';

export default class DebugHighLightPlugin extends Plugin{
    static get pluginName() {
		return 'DebugHighLight';
    }
    
    init(){
        this.editor.commands.add( 'debugHighLight', new HightlightCommand( this.editor) );
    }
}