
export const Vertex = function(x,y,i){
    return {
        x: x,
        y: y,
        idx: i,
        equals: function(v2){
            return x === v2.x && y === v2.y;
        }
    }
}
export const DCEL = () => { 
    return {
        vertices: [],
        halfEdges: [],
        faces: []
    }
}