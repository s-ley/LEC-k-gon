import {Vertex} from './data_structures/DCEL.js';
// Determines if the half edges intersects once
function intersects_once(he1, he2){
    if(he1 === null || he2 === null) return false;
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
function intersected_by_segment_once(seg1, seg2){
    if(!intersected_by_ray_once(seg1, seg2)) return false;
    var inter = single_point_by_ray_intersection(seg1, seg2);
    return in_between(inter, seg1.p1, seg1.p2) && in_between(inter, seg2.p1, seg2.p2);
}

export const Intersections = {
    segment_ray_intersects: intersected_by_ray_once,
    lines_intersection: single_point_by_ray_intersection,
    semgent_segment_intersects: intersected_by_segment_once
}