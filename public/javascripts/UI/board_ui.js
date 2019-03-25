import { Main } from '../main.js';
import { Sites_UI } from './sites_ui.js';

// Buttons and events
$('.Plane .Controls .Reset').on('click', function(e){
    Main.board.reset();
    Main.voronoi.reset();
    Main.polygon.reset();
    Main.delaunay.reset();
    Main.sites.reset();
    Sites_UI.show();
});