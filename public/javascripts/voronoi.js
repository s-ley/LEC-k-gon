import {board} from './board.js';
import { algorithms } from "./algorithms.js";
import { sites } from './sites.js';
import {Vertex, HalfEdge} from './data_structures/DCEL.js';

// Author: Santiago Ley
// Builds the DCEL of the voronoi diagram using the result of the library that builds the delaunay triangulation
// Notes: The delaunay data structure uses Quads from 'Primitives for the Manipulation of General Subdivisions
//            and the Computation of Voronoi Diagrams' which is similar to a DCEL. 
//            next is lnext, prev is lprev, and twin is sym.

// Constants
var bounding_box_distance = 10;
var perpendicular_bisector_point_distance = 10;
// Define A point in infinity
var outside_face = -1;
var outside_point = new Vertex(Infinity, Infinity, outside_face);
outside_point.point_index = -1;

// Global variables
// Board points references
var points = [];
// DCEL
var vertices = [];
var edges = [];
// Global references to the boundary corners
var top_left, top_right, bottom_left, bottom_right;
// Resets global variables
function reset(){
    points = [];
    vertices = [];
    edges = [];
    top_left = top_right = bottom_left = bottom_right = null;
}
// Determines if a-b-c turns left
function ccw(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
}
// Returns the cross products of two vectors in R^3
function cross_product(a, b){
    return {
        x:a.y*b.z-a.z*b.y,
        y:a.z*b.x-a.x*b.z,
        z:a.x*b.y-a.y*b.x
    };
}
// Returns the normalized version of the x and y elements of the vector.
// Returns a vector/point in R^2
function normalize_r2(a){
    var sq = Math.sqrt(a.x*a.x+a.y*a.y);
    return {
        x: a.x / sq,
        y: a.y / sq
    };
}
// Returns the center of the circumcircle of the triangle of the three given points
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
// Determines if the given delaunay edge is part of the convex hull
function outside_edge(delaunay_edge){
    return delaunay_edge.incident_face === outside_face || delaunay_edge.sym.incident_face === outside_face;
}
// Determines if the half edges intersects once
function intersects_once(he1, he2){
    var dx1 = he1.p2.x - he1.p1.x;
    var dx2 = he2.p2.x - he2.p1.x;
    var dy1 = he1.p2.y - he1.p1.y;
    var dy2 = he2.p2.y - he2.p1.y;
    return dx1*dy2 !== dy1*dx2;
}
// Determines if the line given by the half edge is vertical (infinite slope)
function is_vertical(half_edge){
    return half_edge.p1.x === half_edge.p2.x;
}
// Returns the slope of the line determined by the half edge.
function slope(segment){
    var dx = segment.p2.x - segment.p1.x;
    var dy = segment.p2.y - segment.p1.y;
    return dy/dx;
}
// Determines if p is inside the segment given by the points st,ed
function in_between(p, st, ed){
    var a = new Vertex(Math.min(st.x, ed.x), Math.min(st.y, ed.y));
    var b = new Vertex(Math.max(st.x, ed.x), Math.max(st.y, ed.y));
    return a.x <= p.x && p.x <= b.x && a.y <= p.y && p.y <= b.y;
}
// Determines if the segment is intersected by the ray once
function intersected_by_ray_once(segment, ray){
    if(!intersects_once(segment, ray)) return false;
    // Given that the input is not parallel, only one may be vertical
    if(is_vertical(ray)){
        var x = ray.p1.x; // This is the ray line equation
        // Find y
        // (y - y1) = m (x - x1)
        // then y = m*(x-x1)+y1
        var m = slope(segment);
        var y = m*(x-segment.p1.x)+segment.p1.y;
        var intersection = new Vertex(x,y);
        // Determine if the intersection is in the same direction than the ray
        if(in_between(ray.p2, ray.p1, intersection) || in_between(intersection, ray.p1, ray.p2)) return in_between(intersection, segment.p1, segment.p2);
        else return false;
    } else if(is_vertical(segment)){
        // Same as above, now the segment is the vertical line
        var m = slope(ray);
        var x = segment.p1.x;
        var y = m*(x-ray.p1.x)+ray.p1.y;
        var intersection = new Vertex(x,y);
        // Determine if the intersection is in the same direction than the ray
        if(in_between(ray.p2, ray.p1, intersection) || in_between(intersection, ray.p1, ray.p2)) return in_between(intersection, segment.p1, segment.p2);
        else return false;
    }
    // Find intersection point of two lines
    // y = m1*(x-sx1)+sy1
    // y = m2*(x-rx1)+ry1
    // m2*(x-rx1)+ry1 = m1*(x-sx1)+sy1
    // m2*(x-rx1)-m1*(x-sx1) = sy1-ry1
    // m2*x - m2*rx1 - m1*x + m1*sx1 = sy1-ry1
    // (m2-m1)*x = sy1-ry1+m2*rx1-m1*sx1
    // x = (sy1-ry1+m2*rx1-m1*sx1)/(m2-m1)
    var m1 = slope(segment);
    var m2 = slope(ray);
    var x = (segment.p1.y-ray.p1.y+m2*ray.p1.x-m1*segment.p1.x)/(m2-m1);
    var y = m1*(x-segment.p1.x)+segment.p1.y;
    var intersection = new Vertex(x,y);
    // Determine if the intersection is in the same direction than the ray
    if(in_between(ray.p2, ray.p1, intersection) || in_between(intersection, ray.p1, ray.p2))
        return in_between(intersection, segment.p1, segment.p2);
    return false;
}
// Returns the point of the intersection between the line given by the ray and the line given by the segment
// Note: This function assumes the previous one returns true for the given input
function single_point_by_ray_intersection(segment, ray){
    if(is_vertical(ray)){
        var m = slope(segment);
        var x = ray.p1.x;
        var y = m*(x-segment.p1.x)+segment.p1.y;
        return new Vertex(x,y);
    } else if(is_vertical(segment)){
        var m = slope(ray);
        var x = segment.p1.x;
        var y = m*(x-ray.p1.x)+ray.p1.y;
        return new Vertex(x,y);
    }
    var m1 = slope(segment);
    var m2 = slope(ray);
    var x = (segment.p1.y-ray.p1.y+m2*ray.p1.x-m1*segment.p1.x)/(m2-m1);
    var y = m1*(x-segment.p1.x)+segment.p1.y;
    return new Vertex(x,y);
}
// Returns the directed edge from the voronoi vertex to a point that is perpendicular_bisector_point_distance towards the boundary
function outwards_perpendicular_bisector(externalEdge){
    var edge = externalEdge;
    var vertex = vertices[edge.sym.incident_face];
    // Find the line towards the outside using right hand rule.
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
    var endpoint = new Vertex(vertex.x+dir.x*perpendicular_bisector_point_distance, vertex.y+dir.y*perpendicular_bisector_point_distance);
    return new HalfEdge(vertex, endpoint);
}
// Determines if the given quads (Of the delaunay library using our DCEL points) are equal.
function quads_equals(q1, q2){
    return q1.orig.equals(q2.orig) && q1.dest.equals(q2.dest);
}
// Given the delaunay edge, determines all voronoi vertices and stores them in 'vertices'
// Also determines the bounding box borders.
// Also asigns to the delaunay edges its incident face.
function calculate_vertices(externalEdge){
    // Variables to determine the bounding square of the bounded voronoi diagram
    var bb = board.get_bounding_box();
    var minx = bb[0], maxx = bb[2], miny = bb[3], maxy = bb[1];
    
    // BFS
    var curr = externalEdge;
    var queue = [externalEdge];
    var index = 0;
    // Mark the outside edges 
    do{
        queue.push(curr.sym);
        curr.voronoi_mark_1 = true;
        curr.incident_face = outside_face;
        curr = curr.lnext;
    } while(curr !== externalEdge);
    // Generate all circumcenters
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
            // Update min, max values
            minx = Math.min(minx, nxt.x);
            maxx = Math.max(maxx, nxt.x);
            miny = Math.min(miny, nxt.y);
            maxy = Math.max(maxy, nxt.y);
        }
    } while(index < queue.length);
    
    // Generate the corners of the bounding box
    var eps = Math.max(Math.max(maxx-minx, maxy-miny)*0.1, bounding_box_distance);
    top_left = new Vertex(minx-eps, maxy+eps, vertices.length);
    top_right = new Vertex(maxx+eps, maxy+eps, vertices.length+1);
    bottom_left = new Vertex(minx-eps, miny-eps, vertices.length+2);
    bottom_right = new Vertex(maxx+eps, miny-eps, vertices.length+3);
    vertices.push(top_left);
    vertices.push(top_right);
    vertices.push(bottom_left);
    vertices.push(bottom_right);
}

// Builds the DCEL of the bounded voronoi diagram, using the delaunay triangulation and the voronoi vertices.
// It also creates the vertices of the intersection of the voronoi edges and the bounding box.
// ERROR: This doesnt work for |V| = 1,2. When the voronoi vertices are collinear, or if any side of the bounding box 
//          isnt hit by a voronoi edge.
function calculate_edges(externalEdge){
    var index = 0;
    var queue = [externalEdge];
    // Builds the DCEL of the voronoi diagram without the unbounded cells
    do {
        // BFS joining voronoi vertices, assigning all values possible without the unbounded edges.
        // Also, for each delaunay edge, save the half edge it determines and that starts in its incident_face.
        var edge = queue[index++];
        if(!edge.voronoi_mark_2){
            edge.voronoi_mark_2 = true;
            edge.sym.voronoi_mark_2 = true;
            var he1=null, he2=null;
            if(!outside_edge(edge)){   
                // Join two voronoi vertices
                he1 = new HalfEdge(vertices[edge.incident_face], vertices[edge.sym.incident_face]);
                he1.incident_face = edge.dest;
                he2 = new HalfEdge(vertices[edge.sym.incident_face], vertices[edge.incident_face]);
                he2.incident_face = edge.orig;
                edge.dual = he2;
                edge.sym.dual = he1;
                he1.twin = he2;
                he2.twin = he1;
                edges.push(he1);
                edges.push(he2);
            }
            // Add unvisited edges and assign next and prev if possible
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
                edge.sym.lprev.sym.dual.prev = edge.sym.dual;
            }
            if(!edge.sym.lnext.voronoi_mark_2){
                queue.push(edge.sym.lnext);
            } else if(!outside_edge(edge) && !outside_edge(edge.sym.lnext)){
                edge.sym.lnext.dual.next = edge.dual;
                edge.dual.prev = edge.sym.lnext.dual;
            }
        }
    } while(index < queue.length);
    // Builds the DCEL of the external voronoi cells by using a bounding box
    var top_segment = new HalfEdge(top_left, top_right);
    var right_segment = new HalfEdge(top_right, bottom_right);
    var bottom_segment = new HalfEdge(bottom_left, bottom_right);
    var left_segment = new HalfEdge(bottom_left, top_left);

    // Find the top right cell using the boundary of the delaunay triangulation
    var e1 = externalEdge;
    var e2 = e1.lnext;
    while(!intersected_by_ray_once(top_segment, outwards_perpendicular_bisector(e1)) || !intersected_by_ray_once(right_segment, outwards_perpendicular_bisector(e2))){
        e1 = e2;
        e2 = e1.lnext;
    }
    // BOUNDARY
    // Build the top right unbounded region
    // We build new lines using this 4 vertices and the top_right corner
    var left_vertex = vertices[e1.sym.incident_face];
    var right_vertex = vertices[e2.sym.incident_face];
    var vtop = single_point_by_ray_intersection(top_segment, outwards_perpendicular_bisector(e1));
    var vright = single_point_by_ray_intersection(right_segment, outwards_perpendicular_bisector(e2));
    vtop.idx = vertices.length; vertices.push(vtop);
    vright.idx = vertices.length; vertices.push(vright);
    // As our DCEL is ccw from the inside, we hit the right border (i1), go up to the corner (i2), 
    //      go left to the next intersection point (i3), go down throught the line that hits the top border (i4).
    // Note: i0 and i5 are the voronoi edges that are already built inside the voronoi cell if those exist.
    //      if those doesnt exist, we just close from i4 to i1.
    // Error: This doesnt work if a side is not intersected by any perpendicular bisector.
    var i1 = new HalfEdge(right_vertex, vright);
    var i2 = new HalfEdge(vright, top_right);
    var i3 = new HalfEdge(top_right, vtop);
    var i4 = new HalfEdge(vtop, left_vertex);
    var i0 = null, i5 = null;
    if(quads_equals(e1, e2.sym.lnext.sym)){ // If there are no more edges in this cell.
        i0 = i4;
        i5 = i1;
    } else {
        i0 = e2.sym.lnext.dual;
        i5 = e1.sym.lprev.dual.twin;
    }
    // TWINS
    var i1_rev = new HalfEdge(vright, right_vertex);
    var i2_rev = new HalfEdge(top_right, vright);
    var i3_rev = new HalfEdge(vtop, top_right);
    var i4_rev = new HalfEdge(left_vertex, vtop);
    // Assign twin references
    i4.twin = i4_rev; i4_rev.twin = i4;
    i3.twin = i3_rev; i3_rev.twin = i3;
    i2.twin = i2_rev; i2_rev.twin = i2;
    i1.twin = i1_rev; i1_rev.twin = i1;
    // Assign incident_face references
    i1.incident_face = i2.incident_face = i3.incident_face = i4.incident_face = e1.dest;
    i2_rev.incident_face = i3_rev.incident_face = outside_point;
    // Assign next and prev references of those inside, and some outside.
    i0.next = i1; i1.next = i2; i2.next = i3; i3.next = i4; i4.next = i5;
    i5.prev = i4; i4.prev = i3; i3.prev = i2; i2.prev = i1; i1.prev = i0;
    i2_rev.prev = i3_rev; i3_rev.next = i2_rev;
    // Save the reference of the perpendicular edges in the delaunay edges.
    e1.dual = i4_rev; e1.sym.dual = i4;
    e2.dual = i1; e2.sym.dual = i1_rev;
    // Save the edges in the DCEL
    edges.push(i1);
    edges.push(i2);
    edges.push(i3);
    edges.push(i4);
    edges.push(i1_rev);
    edges.push(i2_rev);
    edges.push(i3_rev);
    edges.push(i4_rev);

    // Loop outside until there is only one region left to build
    // Error: doesnt work if a boundary side is not hit by a voronoi edge.
    var destination = e1.lprev.lprev;
    var current_boundary = right_segment;
    var next_boundary = bottom_segment;
    var current_intersection_point = null;
    var next_intersection_point = null;
    var front_vertex = null;
    var next_corner = bottom_right;
    var in_corner = null;
    do {
        e1 = e2;
        e2 = e1.lnext;
        in_corner = intersected_by_ray_once(current_boundary, outwards_perpendicular_bisector(e1)) && intersected_by_ray_once(next_boundary, outwards_perpendicular_bisector(e2));
        front_vertex = e2.sym.lnext.dual.p2;
        current_intersection_point = e1.dual.p2;
        if(!in_corner){
            // We have either a triangle or a 4+ sided polygon
            next_intersection_point = single_point_by_ray_intersection(current_boundary, outwards_perpendicular_bisector(e2));
            next_intersection_point.idx = vertices.length;
            vertices.push(next_intersection_point);
            i1 = new HalfEdge(front_vertex, next_intersection_point);
            i2 = new HalfEdge(next_intersection_point, current_intersection_point);
            i3 = e1.sym.dual;   
            if(quads_equals(e1, e2.sym.lnext.sym)){ // triangle
                i0 = i3;
                i4 = i1;
            } else {
                i0 = e2.sym.lnext.dual;
                i4 = e1.sym.lprev.dual.twin;
            }
            i1_rev = new HalfEdge(next_intersection_point, front_vertex);
            i2_rev = new HalfEdge(current_intersection_point, next_intersection_point);
            i1.twin = i1_rev; i1_rev.twin = i1;
            i2.twin = i2_rev; i2_rev.twin = i2;
            i1.incident_face = i2.incident_face = i3.incident_face = e1.dest;
            i2_rev.incident_face = outside_point;
            i0.next = i1; i1.next = i2; i2.next = i3; i3.next = i4;
            i4.prev = i3; i3.prev = i2; i2.prev = i1; i1.prev = i0;
            i2_rev.prev = i3.twin.next.twin;
            i3.twin.next.twin.next = i2_rev;
            e2.dual = i1; e2.sym.dual = i1_rev;
            edges.push(i1);
            edges.push(i2);
            edges.push(i1_rev);
            edges.push(i2_rev);
        } else {
            // We have either a 4 or a 5+ sided polygon
            next_intersection_point = single_point_by_ray_intersection(next_boundary, outwards_perpendicular_bisector(e2));
            next_intersection_point.idx = vertices.length;
            vertices.push(next_intersection_point);
            i1 = new HalfEdge(front_vertex, next_intersection_point);
            i2 = new HalfEdge(next_intersection_point, next_corner);
            i3 = new HalfEdge(next_corner, current_intersection_point);
            i4 = e1.sym.dual;
            if(quads_equals(e1, e2.sym.lnext.sym)){ // 4 sided
                i0 = i4;
                i5 = i1;
            } else {
                i0 = e2.sym.lnext.dual;
                i5 = e1.sym.lprev.dual.twin;
            }
            i1_rev = new HalfEdge(next_intersection_point, front_vertex);
            i2_rev = new HalfEdge(next_corner, next_intersection_point);
            i3_rev = new HalfEdge(current_intersection_point, next_corner);
            i1.twin = i1_rev; i1_rev.twin = i1;
            i2.twin = i2_rev; i2_rev.twin = i2;
            i3.twin = i3_rev; i3_rev.twin = i3;
            i1.incident_face = i2.incident_face = i3.incident_face = i4.incident_face = e1.dest;
            i2_rev.incident_face = i3_rev.incident_face = outside_point;
            i0.next = i1; i1.next = i2; i2.next = i3; i3.next = i4; i4.next = i5;
            i5.prev = i4; i4.prev = i3; i3.prev = i2; i2.prev = i1; i1.prev = i0;
            i3_rev.next = i2_rev; i2_rev.prev = i3_rev; // corner
            i3_rev.prev = i4.twin.next.twin; i4.twin.next.twin.next = i3_rev; // previous cell
            e2.dual = i1; e2.sym.dual = i1_rev;
            edges.push(i1);
            edges.push(i2);
            edges.push(i3);
            edges.push(i1_rev);
            edges.push(i2_rev);
            edges.push(i3_rev);
            // Change boundaries
            current_boundary = next_boundary;
            if(current_boundary.equals(bottom_segment)){
                next_boundary = left_segment;
                next_corner = bottom_left;
            } else if(current_boundary.equals(left_segment)){
                next_boundary = top_segment;
                next_corner = top_left;
            } else if(current_boundary.equals(top_segment)){
                next_boundary = right_segment;
                next_corner = top_right;
            } else if(current_boundary.equals(right_segment)){
                next_boundary = bottom_segment;
                next_corner = bottom_right;
            } else {
                console.log('Error: voronoi.js line 464');
            }
        }
    } while(!quads_equals(e1, destination));
    // Build last cell
    e1 = e2;
    e2 = e1.lnext;
    if(current_boundary.equals(top_segment)){
        // We have either a triangle or a 4+ sided polygon
        front_vertex = e2.sym.lnext.dual.p2;
        current_intersection_point = e1.dual.p2;
        next_intersection_point = vtop;
        i1 = e2.dual;
        i2 = new HalfEdge(next_intersection_point, current_intersection_point);
        i3 = e1.sym.dual;   
        if(quads_equals(e1, e2.sym.lnext.sym)){ // triangle
            i0 = i3;
            i4 = i1;
        } else {
            i0 = e2.sym.lnext.dual;
            i4 = e1.sym.lprev.dual.twin;
        }
        i1_rev = i1.twin;
        i2_rev = new HalfEdge(current_intersection_point, next_intersection_point);
        i2.twin = i2_rev; i2_rev.twin = i2;
        i1.incident_face = i2.incident_face = i3.incident_face = e1.dest;
        i2_rev.incident_face = outside_point;
        i0.next = i1; i1.next = i2; i2.next = i3; i3.next = i4;
        i4.prev = i3; i3.prev = i2; i2.prev = i1; i1.prev = i0;
        i2_rev.prev = i3.twin.next.twin; i3.twin.next.twin.next = i2_rev; // prev cell
        i2_rev.next = i1.twin.prev.twin; i1.twin.prev.twin.prev = i2_rev; // next cell
        e2.dual = i1; e2.sym.dual = i1_rev;
        edges.push(i2);
        edges.push(i2_rev);
    } else {
        // We have either a 4 or a 5+ sided polygon
        front_vertex = e2.sym.lnext.dual.p2;
        current_intersection_point = e1.dual.p2;
        next_intersection_point = vtop;
        i1 = e2.dual;
        i2 = new HalfEdge(next_intersection_point, next_corner);
        i3 = new HalfEdge(next_corner, current_intersection_point);
        i4 = e1.sym.dual;
        if(quads_equals(e1, e2.sym.lnext.sym)){ // 4 sided
            i0 = i4;
            i5 = i1;
        } else {
            i0 = e2.sym.lnext.dual;
            i5 = e1.sym.lprev.dual.twin;
        }
        i1_rev = i1.twin;
        i2_rev = new HalfEdge(next_corner, next_intersection_point);
        i3_rev = new HalfEdge(current_intersection_point, next_corner);
        i2.twin = i2_rev; i2_rev.twin = i2;
        i3.twin = i3_rev; i3_rev.twin = i3;
        i1.incident_face = i2.incident_face = i3.incident_face = i4.incident_face = e1.dest;
        i2_rev.incident_face = i3_rev.incident_face = outside_point;
        i0.next = i1; i1.next = i2; i2.next = i3; i3.next = i4; i4.next = i5;
        i5.prev = i4; i4.prev = i3; i3.prev = i2; i2.prev = i1; i1.prev = i0;
        i3_rev.next = i2_rev; i2_rev.prev = i3_rev; // corner
        i3_rev.prev = i4.twin.next.twin; i4.twin.next.twin.next = i3_rev; // previous cell
        i2_rev.next = i1.twin.prev.twin; i1.twin.prev.twin.prev = i2_rev; // next cell
        e2.dual = i1; e2.sym.dual = i1_rev;
        edges.push(i2);
        edges.push(i3);
        edges.push(i2_rev);
        edges.push(i3_rev);
    }
}
// Build the DCEL (without faces) of the voronoi diagram
function get_voronoi(externalEdge){
    reset();
    calculate_vertices(externalEdge);
    calculate_edges(externalEdge);
    return {
        vertices: vertices,
        edges: edges
    }
}
// Exports
export const voronoi = {
    get: get_voronoi
}

// HTML EVENTS
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