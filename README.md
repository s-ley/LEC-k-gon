Mayor círculo vacío con restricciones de ubicación en O(kn + nlogn).

![alt text](https://github.com/s-ley/LEC-k-gon/blob/master/preview.gif?raw=true)

Implementación de algoritmos basados en los artículos.
> G.T. Toussaint, 1983. Computing Largest Empty Circles
with Location Constraints. International Journal of
Parallel Programming, v12.5, pp 347-358.
> L.P. Chew and R.L. Drysdale, 1986. Finding Largest
Empty Circles with Location Constraints Dartmouth
Computer Science Technical Report PCS-TR86-130

Se usa la biblioteca de Philippe Legault para la triangulación de 
 Delaunay basada en el algoritmo de Guibas & Stolfi.
https://github.com/Bathlamos/delaunay-triangulation

A la cual se le hace ligeras alteraciones para generar un DCEL
 basado en la descripción de:
> M. de Berg et al. Computational Geometry: Algorithms
and Applications (2ed). Berlin: Springer, 2000. pp
185-197.

Esto para generar el diagrama de Voronoi y poder aplicar el algoritmo
 para el LEC bajo restricciones de ubicación en O(k+nlogn) para
 polígonos convexos de k lados y O(nk + nlogn) para polígonos simples
 de k lados.

Notas:
El algoritmo de la triangulacion de delaunay, puede tener problemas 
 si los puntos estan a una distancia menor de 0.01. Se recomienda
 multiplicarlos por una constante.

TODO:
- Checar los puntos para que no haya problemas de precision al momento de hacer la triangulacion de delaunay.