const Node = function(data){
    return {
        data: data,
        left_child: null,
        right_child: null,
        parent: null,
        height: 1,
    }
}
function get_height(node){
    if(node === null) return 0;
    return node.height;
}

export default class BalancedTree {
    constructor(){
        this.head = null;
    }
    rebalance(node){
        // rebalance
        var result = node;
        if(get_height(node.left_child) > get_height(node.right_child)+1){
            // right turn
            var lr = node.left_child.right_child;
            result = node.left_child;
            result.right_child = node;
            node.left_child = lr;
            result.parent = node.parent;
            node.parent = result;
            if(lr !== null) lr.parent = node;
        } else if(get_height(node.left_child)+1 < get_height(node.right_child)){
            // left turn
            var rl = node.right_child.left_child;
            result = node.right_child;
            result.left_child = node;
            node.right_child = rl;
            result.parent = node.parent;
            node.parent = result;
            if(rl !== null) rl.parent = node;
        }
        // update heights
        node.height = Math.max(get_height(node.left_child), get_height(node.right_child))+1;
        result.height = Math.max(get_height(result.left_child), get_height(result.right_child))+1;
        return result;
    }
    insert(node, dcel_edge, x, y){
        if(node === null){
            return new Node(dcel_edge);
        }
        var ny = node.data.eval(x,y);
        var cy = dcel_edge.eval(x,y);
        if(cy.y<=ny.y) {
            node.left_child = this.insert(node.left_child, dcel_edge, x, y);
            node.left_child.parent = node;
        } else {
            node.right_child = this.insert(node.right_child, dcel_edge, x, y);
            node.right_child.parent = node;
        }
        return this.rebalance(node);
    }
    add(dcel_edge, x, y){
        if(this.head === null){
            this.head = new Node(dcel_edge);
            return this.head;
        }
        this.head = this.insert(this.head, dcel_edge, x+0.01, y);
    }
    remove(node, dcel_edge, x, y){
        if(node === null) return null;
        if(node.data.equals(dcel_edge)){
            if(node.left_child === null){
                if(node.right_child !== null) node.right_child.parent = node.parent;
                return node.right_child;
            } else if(node.right_child === null){
                if(node.left_child !== null) node.left_child.parent = node.parent;
                return node.left_child;
            } else if(node.left_child.right_child === null){
                node.left_child.parent = node.parent;
                node.left_child.right_child = node.right_child;
                node.right_child.parent = node.left_child;
                return this.rebalance(node.left_child);
            } else {
                var prv = node.left_child;
                while(prv.right_child !== null && prv.right_child.right_child !== null){
                    prv = prv.right_child;
                }
                var res = prv.right_child;
                if(prv.right_child !== null) prv.right_child = prv.right_child.left_child;
                res.left_child = node.left_child;
                res.right_child = node.right_child;
                res.parent = node.parent;
                if(prv.right_child !== null) prv.right_child.parent = prv;
                // update heights
                var tmp = [res.left_child];
                while(tmp[tmp.length-1].right_child !== null){
                    tmp.push(tmp[tmp.length-1].right_child);
                }
                while(tmp.length>1){
                    tmp[tmp.length-2].right_child = this.rebalance(tmp[tmp.length-1]);
                    tmp.pop();
                }
                res.left_child = this.rebalance(res.left_child);
                return this.rebalance(res);
            }
        }
        var ny = node.data.eval(x,y);
        var cy = dcel_edge.eval(x,y);
        if(cy.y<=ny.y) {
            node.left_child = this.remove(node.left_child, dcel_edge, x, y);
            if(node.left_child !== null) node.left_child.parent = node;
        } else {
            node.right_child = this.remove(node.right_child, dcel_edge, x, y);
            if(node.right_child !== null) node.right_child.parent = node;
        }
        return this.rebalance(node);
    }
    del(dcel_edge, x, y){
        this.head = this.remove(this.head, dcel_edge, x+0.01, y);
    }
    look(node, dcel_edge, x, y){
        if(node === null) return null;
        if(node.data.equals(dcel_edge)){
            return node;
        }
        var ny = node.data.eval(x,y);
        var cy = dcel_edge.eval(x,y);
        if(cy.y<=ny.y) {
            return this.look(node.left_child, dcel_edge, x, y);
        } else {
            return this.look(node.right_child, dcel_edge, x, y);
        }
    }
    find(dcel_edge, x, y){
        return this.look(this.head, dcel_edge, x+0.01, y);
    }
    prev(node){
        if(node === null) return null;
        if(node.left_child === null){
            while(node.parent !== null && node.parent.left_child === node) node = node.parent;
            return node.parent;
        }
        var tmp = node.left_child;
        while(tmp.right_child !== null) tmp = tmp.right_child;
        return tmp;
    }
    next(node){
        if(node === null) return null;
        if(node.right_child === null){
            while(node.parent !== null && node.parent.right_child === node) node = node.parent;
            return node.parent;
        }
        var tmp = node.right_child;
        while(tmp.left_child !== null) tmp = tmp.left_child;
        return tmp;
    }
}