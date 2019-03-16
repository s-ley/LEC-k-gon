import {Vertex} from './data_structures/DCEL.js';
import {voronoi} from './voronoi.js';


// Be careful to not have duplicate points
function delaunay_quads_guibas_stolfi(board_points){
    if(board_points.length <= 1)
    return;
    var points = board_points.map((p, idx) => {
        var nxt = new Vertex(p.coords.usrCoords[1], p.coords.usrCoords[2], idx);
        nxt.point_index = p.idx;
        return nxt;
    });
    var delaunay = Delaunay(points);
    return delaunay.getQuads();
}

function get_faces(externalEdge){
    var index = 0;
    var queue = [externalEdge];
    var triangles = [];
    var tmp = [];
    var curr = externalEdge;
    do {
        queue.push(curr.sym);
        curr.mark = true;
        curr = curr.lnext;
    } while(curr !== externalEdge);
    do {
        var edge = queue[index++];
        if(!edge.mark) {
            // Stores the edges for a visited triangle. Also pushes sym (neighbour) edges on stack to visit later.
            curr = edge;
            do {
                tmp.push(curr.orig);
                if(tmp.length >=3){
                    triangles.push(tmp);
                    tmp = [];
                }
                if (!curr.sym.mark)
                queue.push(curr.sym);
                
                curr.mark = true;
                curr = curr.lnext;
            } while(curr != edge);
        }
    } while(index < queue.length);
    return triangles;
}

export const algorithms = {
    delaunay: delaunay_quads_guibas_stolfi,
    voronoi: voronoi.get,
    get_faces: get_faces
};