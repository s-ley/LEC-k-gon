
export const Vertex = function(x,y,i){
    return {
        x: x,
        y: y,
        idx: i,
        point_index: null,
        mark_face: false,
        equals: function(v2){
            return x === v2.x && y === v2.y;
        }
    }
}
export const HalfEdge = function(p1, p2){
    return {
        p1: p1,
        p2: p2,
        incident_face: null,
        number_of_intersections: 0,
        dfs_visited: false,
        twin: null,
        next: null,
        prev: null,
        equals: function(he){
            return this.p1.equals(he.p1) && this.p2.equals(he.p2);
        }
    }
}
export const Face = function(p, he){
    return {
        identifier: p,
        incident_edge: he
    }
}