import { Main } from '../main.js';
import { Sites_UI } from './sites_ui.js';

// Buttons and events
$('.Plane .Controls .Reset').on('click', function(e){
    Main.board.reset();
    Main.sites.reset();
    Main.delaunay.reset();
    Main.polygon.reset();
    Sites_UI.show();
});