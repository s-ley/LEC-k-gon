import './file_loader.js';
import './random_section.js';
import { board } from './board.js';
import { error } from './error.js';

// Set everything up
$( document ).ready(function() {
    board.init([-3, 3, 3, -3]); 
    error.update();
});