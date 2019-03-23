// Use a binary tree, not a hashtable
export default class PairSet{
    constructor(){
        this.set = {};
    }
    add(a, b){
        if(!this.set[a]) this.set[a] = {};
        if(!this.set[a][b]) this.set[a][b] = true;
    }
    has(a, b){
        return !!(this.set[a] && this.set[a][b]);
    }
    reset(){
        this.set = {};
    }
    del(a, b){
        if(this.has(a,b)) delete this.set[a][b];
    }
}
