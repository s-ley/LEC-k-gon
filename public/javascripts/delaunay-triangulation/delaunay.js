/*
 (c) 2016, Philippe Legault
 An implementation of Guibas & Stolfi's O(nlogn) Delaunay triangulation algorithm
 https://github.com/Bathlamos/delaunay-triangulation
 */

(function () {

    function Delaunay(points) {
        if (!(this instanceof Delaunay))
            return new Delaunay(points);

        this.points = points || [];
    }

    Delaunay.prototype = {
        getQuads: function() {
            var pts = this.points;

            // Initial sorting of the points
            pts.sort(function(a,b) {
                if(a.x === b.x)
                    return a.y - b.y;
                return a.x - b.x;
            });

            // Remove duplicates
            for(var i = pts.length - 1; i >= 1; i--)
                if(pts[i].equals(pts[i-1]))
                    pts.splice(i, 1); // Costly operation, but there shouldn't be that many duplicates

            if(pts.length < 2)
                return {};

            var externalEdge = delaunay(pts).le.sym;
            return externalEdge;
        },
        triangulate: function() {
            var pts = this.points;

            // Initial sorting of the points
            pts.sort(function(a,b) {
                if(a.x === b.x)
                    return a.y - b.y;
                return a.x - b.x;
            });

            // Remove duplicates
            for(var i = pts.length - 1; i >= 1; i--)
                if(pts[i].equals(pts[i-1]))
                    pts.splice(i, 1); // Costly operation, but there shouldn't be that many duplicates

            if(pts.length < 2)
                return {};

            var quadEdge = delaunay(pts).le;

            //All edges marked false
            var faces = [];
            var queueIndex = 0;
            var queue = [quadEdge];

            var tmp = [];
            // Mark all outer edges as visited
            while(leftOf(quadEdge.onext.dest, quadEdge))
                quadEdge = quadEdge.onext;

            var curr = quadEdge;
            do {
                queue.push(curr.sym);
                curr.mark = true;
                curr = curr.lnext;
            } while(curr !== quadEdge);

            do {
                var edge = queue[queueIndex++];
                if(!edge.mark) {
                    // Stores the edges for a visited triangle. Also pushes sym (neighbour) edges on stack to visit later.
                    curr = edge;
                    do {
                        tmp.push(curr.orig);
                        if(tmp.length >=3){
                            faces.push(tmp);
                            tmp = [];
                        }
                        if (!curr.sym.mark)
                            queue.push(curr.sym);

                        curr.mark = true;
                        curr = curr.lnext;
                    } while(curr != edge);
                }
            } while(queueIndex < queue.length);

            return faces;
        }
    };

    /*
    Computes | a.x  a.y  1 |
             | b.x  b.y  1 | > 0
             | c.x  c.y  1 |
     */
    function ccw(a, b, c) {
        return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
    }

    function rightOf(x, e) {
        return ccw(x, e.dest, e.orig);
    }

    function leftOf(x, e) {
        return ccw(x, e.orig, e.dest);
    }

    function valid(e, basel) {
        return rightOf(e.dest, basel);
    }

    /*
     Computes | a.x  a.y  a.x�+a.y�  1 |
              | b.x  b.y  b.x�+b.y�  1 | > 0
              | c.x  c.y  c.x�+c.y�  1 |
              | d.x  d.y  d.x�+d.y�  1 |

     * Return true is d is in the circumcircle of a, b, c
     */
    function inCircle(a, b, c, d){

        if((a.x === d.x && a.y === d.y)
            || (b.x === d.x && b.y === d.y)
            || (c.x === d.x && c.y === d.y))
            return false;

        var sa = a.x * a.x + a.y * a.y,
            sb = b.x * b.x + b.y * b.y,
            sc = c.x * c.x + c.y * c.y,
            sd = d.x * d.x + d.y * d.y;

        var d1 = sc - sd,
            d2 = c.y - d.y,
            d3 = c.y * sd - sc * d.y,
            d4 = c.x - d.x,
            d5 = c.x * sd - sc * d.x,
            d6 = c.x * d.y - c.y * d.x;

        return a.x * (b.y * d1 - sb * d2 + d3)
            - a.y * (b.x * d1 - sb * d4 + d5)
            + sa * (b.x * d2 - b.y * d4 + d6)
            - b.x * d3 + b.y * d5 - sb * d6 > 1; // We have an issue here with number accuracy
    }

    function QuadEdge(onext, rot, orig) {
        this.onext = onext; // QuadEdge
        this.rot = rot;     // QuadEdge
        this.orig = orig;   // point
        this.mark = false;  // for drawing
        this.mark_delaunay_1 = false; // for delaunay_dcel
        this.dcel_half_edge = null;
    }

    QuadEdge.prototype = {
        get sym(){return this.rot.rot;},
        get dest(){return this.sym.orig;},
        get rotSym(){return this.rot.sym;},
        get oprev(){return this.rot.onext.rot;},
        get dprev(){return this.rotSym.onext.rotSym;},
        get lnext(){return this.rotSym.onext.rot;},
        get lprev(){return this.onext.sym;},
        get rprev(){return this.sym.onext;}
    };

    function makeEdge(orig, dest) {
        var q0 = new QuadEdge(null, null, orig),
            q1 = new QuadEdge(null, null, null),
            q2 = new QuadEdge(null, null, dest),
            q3 = new QuadEdge(null, null, null);

        // create the segment
        q0.onext = q0; q2.onext = q2; // lonely segment: no "next" quadedge
        q1.onext = q3; q3.onext = q1; // in the dual: 2 communicating facets

        // dual switch
        q0.rot = q1; q1.rot = q2;
        q2.rot = q3; q3.rot = q0;
        return q0;
    }

    /**
     * Attach/detach the two edges = combine/split the two rings in the dual space
     *
     * @param a the first QuadEdge to attach/detach
     * @param b the second QuadEdge to attach/detach
     */
    function splice(a, b) {
        var alpha = a.onext.rot,
            beta = b.onext.rot;

        var t2 = a.onext,
            t3 = beta.onext,
            t4 = alpha.onext;

        a.onext = b.onext;
        b.onext = t2;
        alpha.onext = t3;
        beta.onext = t4;
    }

    /**
     * Create a new QuadEdge by connecting 2 QuadEdges
     *
     * @param a the first QuadEdges to connect
     * @param b the second QuadEdges to connect
     * @return the new QuadEdge
     */
    function connect(a, b) {
        var q = makeEdge(a.dest, b.orig);
        splice(q, a.lnext);
        splice(q.sym, b);
        return q;
    }

    function deleteEdge(q) {
        splice(q, q.oprev);
        splice(q.sym, q.sym.oprev);
    }

    function delaunay(s) {
        var a, b, c, t;

        if(s.length === 2) {
            a = makeEdge(s[0], s[1]);
            return {
                le: a,
                re: a.sym
            }
        } else if(s.length === 3) {
            a = makeEdge(s[0], s[1]);
            b = makeEdge(s[1], s[2]);
            splice(a.sym, b);

            if(ccw(s[0], s[1], s[2])) {
                c = connect(b, a);
                return {
                    le: a,
                    re: b.sym
                }
            } else if(ccw(s[0], s[2], s[1])) {
                c = connect(b, a);
                return {
                    le: c.sym,
                    re: c
                }
            } else { // All three points are colinear
                return {
                    le: a,
                    re: b.sym
                }
            }
        } else { // |S| >= 4
            var half_length = Math.ceil(s.length / 2);
            var left = delaunay(s.slice(0,half_length));
            var right = delaunay(s.slice(half_length));

            var ldo = left.le,
                ldi = left.re,
                rdi = right.le,
                rdo = right.re;

            // Compute the lower common tangent of L and R
            do {
                if(leftOf(rdi.orig, ldi))
                    ldi = ldi.lnext;
                else if(rightOf(ldi.orig, rdi))
                    rdi = rdi.rprev;
                else
                    break;
            } while(true);

            var basel = connect(rdi.sym, ldi);
            
            if(ldi.orig === ldo.orig)
                ldo = basel.sym;
            if(rdi.orig === rdo.orig)
                rdo = basel;

            // This is the merge loop.
            do {
                // Locate the first L point (lcand.Dest) to be encountered by the rising bubble,
                // and delete L edges out of base1.Dest that fail the circle test.
                var lcand = basel.sym.onext;
                if(valid(lcand, basel)) {
                    while(inCircle(basel.dest, basel.orig, lcand.dest, lcand.onext.dest)) {
                        t = lcand.onext;
                        deleteEdge(lcand);
                        lcand = t;
                    }
                }

                //Symmetrically, locate the first R point to be hit, and delete R edges
                var rcand = basel.oprev;
                if(valid(rcand, basel)) {
                    while(inCircle(basel.dest, basel.orig, rcand.dest, rcand.oprev.dest)) {
                        t = rcand.oprev;
                        deleteEdge(rcand);
                        rcand = t;
                    }
                }

                // If both lcand and rcand are invalid, then basel is the upper common tangent
                if(!valid(lcand, basel) && !valid(rcand, basel))
                    break;

                // The next cross edge is to be connected to either lcand.Dest or rcand.Dest
                // If both are valid, then choose the appropriate one using the InCircle test
                if(!valid(lcand, basel) || (valid(rcand, basel) && inCircle(lcand.dest, lcand.orig, rcand.orig, rcand.dest)))
                // Add cross edge basel from rcand.Dest to basel.Dest
                    basel = connect(rcand, basel.sym);
                else
                // Add cross edge base1 from basel.Org to lcand. Dest
                    basel = connect(basel.sym, lcand.sym);
            } while(true);

            return {
                le: ldo,
                re: rdo
            }
        }
    }

    /* test-code */
    Delaunay.prototype.ccw = ccw;
    Delaunay.prototype.rightOf = rightOf;
    Delaunay.prototype.leftOf = leftOf;
    Delaunay.prototype.inCircle = inCircle;
    /* end-test-code */


    // export as AMD/CommonJS module or global variable
    if (typeof define === 'function' && define.amd) define('Delaunay', function () { return Delaunay; });
    else if (typeof module !== 'undefined') module.exports = Delaunay;
    else if (typeof self !== 'undefined') self.Delaunay = Delaunay;
    else window.Delaunay = Delaunay;

})();