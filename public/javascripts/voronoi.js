import {board} from './board.js';
import { algorithms } from "./algorithms.js";
import { sites } from './sites.js';
import {Vertex, HalfEdge} from './data_structures/DCEL.js';

var outside_face = -1;
var outside_point = new Vertex(Infinity, Infinity, outside_face);
outside_point.point_index = -1;
var points = [];
var vertices = [];
var edges = [];
var top_left, top_right, bottom_left, bottom_right;

function reset(){
    points = [];
    vertices = [];
    edges = [];
    top_left = top_right = bottom_left = bottom_right = null;
}

function ccw(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
}
// for R^3
function cross_product(a, b){
    return {
        x:a.y*b.z-a.z*b.y,
        y:a.z*b.x-a.x*b.z,
        z:a.x*b.y-a.y*b.x
    };
}
function normalize_r2(a){
    var sq = Math.sqrt(a.x*a.x+a.y*a.y);
    return {
        x: a.x / sq,
        y: a.y / sq
    };
}
function triangle_circumcircle(p0, p1, p2) {
    // Code done by Matias Savela in https://github.com/msavela/delaunay
    // Reference: http://www.faqs.org/faqs/graphics/algorithms-faq/ Subject 1.04
    var A = p1.x - p0.x;
    var B = p1.y - p0.y;
    var C = p2.x - p0.x;
    var D = p2.y - p0.y;
    
    var E = A * (p0.x + p1.x) + B * (p0.y + p1.y);
    var F = C * (p0.x + p2.x) + D * (p0.y + p2.y);
    
    var G = 2.0 * (A * (p2.y - p1.y) - B * (p2.x - p1.x));
    
    var dx, dy;
    var center = null;
    
    // Collinear points, get extremes and use midpoint as center
    if(Math.round(Math.abs(G)) == 0) {
        var minx = Math.min(p1.x, p1.x, p2.x);
        var miny = Math.min(p0.y, p1.y, p2.y);
        var maxx = Math.max(p0.x, p1.x, p2.x);
        var maxy = Math.max(p0.y, p1.y, p2.y);
        
        center = new Vertex((minx + maxx) / 2, (miny + maxy) / 2);
        
        dx = center.x - minx;
        dy = center.y - miny;
    } else {
        var cx = (D * E - B * F) / G;
        var cy = (A * F - C * E) / G;
        
        center = new Vertex(cx, cy, vertices.length);
        
        dx = center.x - p0.x;
        dy = center.y - p0.y;
    }
    center.radius = Math.sqrt(dx * dx + dy * dy);
    
    return center;
}

function calculate_vertices(externalEdge){
    // bounding points
    var bb = board.get_bounding_box();
    var minx = bb[0];
    var maxx = bb[2];
    var miny = bb[3];
    var maxy = bb[1];
    
    // Vars for bfs
    var curr = externalEdge;
    var queue = [externalEdge];
    var index = 0;
    // Mark outside of delaunay 
    do{
        queue.push(curr.sym);
        curr.voronoi_mark_1 = true;
        curr.incident_face = outside_face;
        curr = curr.lnext;
    } while(curr !== externalEdge);
    do {
        var edge = queue[index++];
        if(!edge.voronoi_mark_1){
            curr = edge;
            var triangle = [];
            do{
                triangle.push(curr.orig);
                
                if (!curr.sym.voronoi_mark_1)
                queue.push(curr.sym);
                
                curr.voronoi_mark_1 = true;
                curr.incident_face = vertices.length;
                curr = curr.lnext;
            } while(curr != edge);
            var nxt = triangle_circumcircle(triangle[0], triangle[1], triangle[2]);
            vertices.push(nxt);
            minx = Math.min(minx, nxt.x);
            maxx = Math.max(maxx, nxt.x);
            miny = Math.min(miny, nxt.y);
            maxy = Math.max(maxy, nxt.y);
        }
    } while(index < queue.length);
    
    var eps = Math.max(Math.max(maxx-minx, maxy-miny)*0.1, 10);
    
    top_left = new Vertex(minx-eps, maxy+eps, vertices.length);
    top_right = new Vertex(maxx+eps, maxy+eps, vertices.length+1);
    bottom_left = new Vertex(minx-eps, miny-eps, vertices.length+2);
    bottom_right = new Vertex(maxx+eps, miny-eps, vertices.length+2);
    vertices.push(top_left);
    vertices.push(top_right);
    vertices.push(bottom_left);
    vertices.push(bottom_right);
}

function outside_edge(delaunay_edge){
    return delaunay_edge.incident_face === outside_face || delaunay_edge.sym.incident_face === outside_face;
}

function parallel(s1, s2){
    var dx1 = s1.p2.x - s1.p1.x;
    var dx2 = s2.p2.x - s2.p1.x;
    var dy1 = s1.p2.y - s1.p1.y;
    var dy2 = s2.p2.y - s2.p1.y;
    return dx1*dy2 === dy1*dx2;
}
function vertical(half_edge){
    return half_edge.p1.x === half_edge.p2.x;
}   
function slope(segment){
    var dx = segment.p2.x - segment.p1.x;
    var dy = segment.p2.y - segment.p1.y;
    return dy/dx;
}
function in_between(p, st, ed){
    var a = new Vertex(Math.min(st.x, ed.x), Math.min(st.y, ed.y));
    var b = new Vertex(Math.max(st.x, ed.x), Math.max(st.y, ed.y));
    return a.x <= p.x && p.x <= b.x && a.y <= p.y && p.y <= b.y;
}
// Only works with boundaries right now
// Boundaries are at a distance at least 10
function intersected_by_ray_once(segment, ray){
    if(parallel(segment, ray)) return false;

    if(vertical(ray)){
        // then segment must not be vertical
        var m = slope(segment);
        // (y - y1) = m (x - x1)
        // x = ray.p1.x because line is vertical
        // then y = m*(x-x1)+y1
        var x = ray.p1.x;
        var y = m*(x-segment.p1.x)+segment.p1.y;
        var intersection = new Vertex(x,y);
        if(in_between(ray.p2, ray.p1, intersection)) return in_between(intersection, segment.p1, segment.p2);
        else return false;
    } else if(vertical(segment)){
        var m = slope(ray);
        var x = segment.p1.x;
        var y = m*(x-ray.p1.x)+ray.p1.y;
        var intersection = new Vertex(x,y);
        if(in_between(ray.p2, ray.p1, intersection)) return in_between(intersection, segment.p1, segment.p2);
        else return false;
    }
    // both are not vertical
    var m1 = slope(segment);
    var m2 = slope(ray);
    // y = m1*(x-sx1)+sy1
    // y = m2*(x-rx1)+ry1
    // m2*(x-rx1)+ry1 = m1*(x-sx1)+sy1
    // m2*(x-rx1)-m1*(x-sx1) = sy1-ry1
    // m2*x - m2*rx1 - m1*x + m1*sx1 = sy1-ry1
    // (m2-m1)*x = sy1-ry1+m2*rx1-m1*sx1
    // x = (sy1-ry1+m2*rx1-m1*sx1)/(m2-m1)
    var x = (segment.p1.y-ray.p1.y+m2*ray.p1.x-m1*segment.p1.x)/(m2-m1);
    var y = m1*(x-segment.p1.x)+segment.p1.y;
    var intersection = new Vertex(x,y);
    if(in_between(ray.p2, ray.p1, intersection))
        return in_between(intersection, segment.p1, segment.p2);
    return false;
}
function single_point_by_ray_intersection(segment, ray){
    if(parallel(segment, ray)) return false;
    if(vertical(ray)){
        var m = slope(segment);
        var x = ray.p1.x;
        var y = m*(x-segment.p1.x)+segment.p1.y;
        return new Vertex(x,y,vertices.length);
    } else if(vertical(segment)){
        var m = slope(ray);
        var x = segment.p1.x;
        var y = m*(x-ray.p1.x)+ray.p1.y;
        return new Vertex(x,y,vertices.length);
    }
    // both are not vertical
    var m1 = slope(segment);
    var m2 = slope(ray);
    var x = (segment.p1.y-ray.p1.y+m2*ray.p1.x-m1*segment.p1.x)/(m2-m1);
    var y = m1*(x-segment.p1.x)+segment.p1.y;
    return new Vertex(x,y,vertices.length);
}

function outwards_perpendicular_bisector(externalEdge){
    var edge = externalEdge;
    var vertex = vertices[edge.sym.incident_face];
    // Find the line towards the outside using cross product
    var a = {
        x:edge.orig.x-edge.dest.x,
        y:edge.orig.y-edge.dest.y,
        z:0
    };
    var b = {
        x:0,
        y:0,
        z:1
    };
    var dir = normalize_r2(cross_product(a,b));
    var endpoint = new Vertex(vertex.x+dir.x*9, vertex.y+dir.y*9, vertices.length);
    return new HalfEdge(vertex, endpoint);
}

// Generates the voronoi edges by joining the adyacent triangles vertex.
function calculate_edges(externalEdge){
    var index = 0;
    var queue = [externalEdge];
    // do bfs of edges
    do {
        var edge = queue[index++];
        if(!edge.voronoi_mark_2){
            // mark both sides
            edge.voronoi_mark_2 = true;
            edge.sym.voronoi_mark_2 = true;
            
            var he1=null, he2=null;
            if(!outside_edge(edge)){   
                // Join two voronoi vertices
                he1 = new HalfEdge(vertices[edge.incident_face], vertices[edge.sym.incident_face]);
                he1.incident_face = edge.dest;
                he2 = new HalfEdge(vertices[edge.sym.incident_face], vertices[edge.incident_face]);
                he2.incident_face = edge.orig;
                // orig->dest points dest.incident->orig.incident
                edge.dual = he2;
                edge.sym.dual = he1;
                
                he1.twin = he2;
                he2.twin = he1;
                edges.push(he1);
                edges.push(he2);
            }
            
            // add incident edges
            if(!edge.lprev.voronoi_mark_2){
                queue.push(edge.lprev);
            } else if(!outside_edge(edge) && !outside_edge(edge.lprev)){
                edge.dual.next = edge.lprev.sym.dual;
                edge.lprev.sym.dual.prev = edge.dual;
            }
            if(!edge.lnext.voronoi_mark_2){
                queue.push(edge.lnext);
            } else if(!outside_edge(edge) && !outside_edge(edge.lnext)){
                edge.sym.dual.prev = edge.lnext.dual;
                edge.lnext.dual.next = edge.sym.dual;
            }
            if(!edge.sym.lprev.voronoi_mark_2){
                queue.push(edge.sym.lprev);
            } else if(!outside_edge(edge) && !outside_edge(edge.sym.lprev)){
                edge.sym.dual.next = edge.sym.lprev.sym.dual;
                edge.sym.lprev.sym.dual = edge.sym.dual.next;
            }
            if(!edge.sym.lnext.voronoi_mark_2){
                queue.push(edge.sym.lnext);
            } else if(!outside_edge(edge) && !outside_edge(edge.sym.lnext)){
                edge.sym.lnext.dual.next = edge.dual;
                edge.dual.prev = edge.sym.lnext.dual;
            }
        }
    } while(index < queue.length);
    
    // GENERATE OUTSIDE EDGES
    var top_segment = new HalfEdge(top_left, top_right);
    var right_segment = new HalfEdge(top_right, bottom_right);
    var e1 = externalEdge;
    var e2 = e1.lnext;
    // Find top right corner
    // As it is going ccw outside, the top corner is the first pair that the perpendicular bisectors hit the right and top walls
    while(!intersected_by_ray_once(top_segment, outwards_perpendicular_bisector(e1)) || !intersected_by_ray_once(right_segment, outwards_perpendicular_bisector(e2))){
        e1 = e2;
        e2 = e1.lnext;
    }
    // Make the top right region
    var left_vertex = vertices[e1.sym.incident_face];
    var right_vertex = vertices[e2.sym.incident_face];
    var vtop = single_point_by_ray_intersection(top_segment, outwards_perpendicular_bisector(e1));
    vertices.push(vtop);
    var vright = single_point_by_ray_intersection(right_segment, outwards_perpendicular_bisector(e2));
    vertices.push(vright);

    // Inside
    var i0 = e2.sym.lnext.dual;
    var i1 = new HalfEdge(right_vertex, vright);
    var i1_rev = new HalfEdge(vright, right_vertex);
    i1.twin = i1_rev;
    i1_rev.twin = i1;
    var i2 = new HalfEdge(vright, top_right);
    var i2_rev = new HalfEdge(top_right, vright);
    i2.twin = i2_rev;
    i2_rev.twin = i2;
    var i3 = new HalfEdge(top_right, vtop);
    var i3_rev = new HalfEdge(vtop, top_right);
    i3.twin = i3_rev;
    i3_rev.twin = i3;
    var i4 = new HalfEdge(vtop, left_vertex);
    var i4_rev = new HalfEdge(left_vertex, vtop);
    i4.twin = i4_rev;
    i4_rev.twin = i4;
    var i5 = e1.sym.lprev.dual.twin;

    // Incident face
    i1.incident_face = i2.incident_face = i3.incident_face = i4.incident_face = e1.dest;
    // Next Prev
    i0.next = i1; i1.next = i2; i2.next = i3; i3.next = i4; i4.next = i5;
    i5.prev = i4; i4.prev = i3; i3.prev = i2; i2.prev = i1; i1.prev = i0;
    // Outside Face
    // Incident face
    i2.incident_face = i3.incident_face = outside_point;
    // Next Prev
    i2_rev.prev = i3_rev;
    i3_rev.next = i2_rev;

    edges.push(i1);
    edges.push(i2);
    edges.push(i3);
    edges.push(i4);
}


function get_voronoi(externalEdge){
    reset();
    calculate_vertices(externalEdge);
    calculate_edges(externalEdge);
    
    return {
        vertices: vertices,
        edges: edges,
    }
}

export const voronoi = {
    get: get_voronoi
}

// HTML Display
$('#Voronoi').on('click', ()=>{
    var external_delaunay_edge = algorithms.delaunay(sites.get());
    get_voronoi(external_delaunay_edge);
    
    vertices.map(p => {
        p.point_index = board.get_points().length;
        points.push(board.add_point(p.x, p.y, 'green'));
    });
    edges.map(e => {
        board.add_segment(points[e.p1.idx], points[e.p2.idx], 1, 0, 'green', e);
    });
});