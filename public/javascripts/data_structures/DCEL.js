
export const VertexData = function(local_id, global_id){
    return {
        local_id: local_id,
        global_id: global_id
    }
}
export const Vertex = function(x,y,data){
    return {
        x: x,
        y: y,
        data: data,
        equals: function(v2){
            var dx = x - v2.x, dy = y - v2.y;
            return Math.sqrt(dx*dx+dy*dy)<0.01;
        }
    }
}

export const HalfEdgeData = function(local_id, global_id, collection=null){
    return {
        local_id: local_id,
        global_id: global_id,
        lec_number_of_intersections: 0,
        lec_dfs_visited: false,
        delaunay_mark: false,
        voronoi_mark: false,
        intersector: null,
        collection: collection
    }
}
export const HalfEdge = function(p1, p2, data){
    return {
        p1: p1,
        p2: p2,
        incident_face: null,
        twin: null,
        next: null,
        prev: null,
        data: data,
        equals: function(he){
            return this.p1.equals(he.p1) && this.p2.equals(he.p2);
        },
        to_html: function(){
            if(this.incident_face !== null && this.incident_face.identifier !== null && this.incident_face.identifier.data !== null) return `(<strong>${this.incident_face.identifier.data.global_id}<strong>)(${p1.data.global_id} -> ${p2.data.global_id})`;
            return `(${p1.data.global_id} -> ${p2.data.global_id})`;
        }
    }
}
export const FaceData = function(local_id){
    return {
        local_id: local_id,
        union_find_value: local_id
    };
}
export const Face = function(p, he, data){
    return {
        identifier: p,
        incident_edge: he,
        data: data
    }
}