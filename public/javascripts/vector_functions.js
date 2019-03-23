import { Vertex, VertexData } from './data_structures/DCEL.js';
// Returns the cross products of two vectors in R^3
function cross_product(a, b){
    return {
        x:a.y*b.z-a.z*b.y,
        y:a.z*b.x-a.x*b.z,
        z:a.x*b.y-a.y*b.x
    };
}
// Returns a vector of length c, using the first 2 coordinates of a (x,y)
// Returns a vector/point in R^2
function normalize_r2(a, c=1){
    var sq = Math.sqrt(a.x*a.x+a.y*a.y);
    return {
        x: a.x*c / sq,
        y: a.y*c / sq
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
        
        center = new Vertex((minx + maxx) / 2, (miny + maxy) / 2, null);
        
        dx = center.x - minx;
        dy = center.y - miny;
    } else {
        var cx = (D * E - B * F) / G;
        var cy = (A * F - C * E) / G;
        
        center = new Vertex(cx, cy, null);
        
        dx = center.x - p0.x;
        dy = center.y - p0.y;
    }
    center.radius = Math.sqrt(dx * dx + dy * dy);
    
    return center;
}
// Determines if the half edges intersects once
function intersects_once(he1, he2){
    var dx1 = he1.p2.x - he1.p1.x;
    var dx2 = he2.p2.x - he2.p1.x;
    var dy1 = he1.p2.y - he1.p1.y;
    var dy2 = he2.p2.y - he2.p1.y;
    return dx1*dy2 !== dy1*dx2;
}
function polygon_edges_are_collinear(dcel_half_edges){
    var collinear = true;
    for(var i = 0; i+2<dcel_half_edges.length; i+=2){
        if(intersects_once(dcel_half_edges[i], dcel_half_edges[i+2])){
            collinear = false;
            break;
        }
    }
    return collinear;
}

export const Vector = {
    cross_product: cross_product,
    normalize: normalize_r2,
    circumcircle: triangle_circumcircle,
    collinear: polygon_edges_are_collinear
}