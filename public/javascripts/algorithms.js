function generate_delaunay(board_points){
    if(board_points.length < 3)
        return;
    
    var vertices = board_points.map((p,i) => new delaunay.Vertex(p.coords.usrCoords[1], p.coords.usrCoords[2], i));
    
    var triangles = delaunay.triangulate(vertices);
    
    return triangles;
}

export const algorithms = {
    delaunay: generate_delaunay
};