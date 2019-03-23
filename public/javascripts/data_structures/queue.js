const Node = function(data){
    return {
        data: data,
        next: null,
        prev: null
    };
}
export default class Queue{
    constructor(){
        this.head = null;
        this.tail = null;
        this.len = 0;
    }
    push(data){
        if(this.head === null) this.head = this.tail = new Node(data);
        else {
            var nxt = new Node(data);
            this.tail.next = nxt;
            nxt.prev = this.tail;
            this.tail = nxt;
        }
        this.len += 1;
    }
    empty(){
        return this.len === 0;
    }
    peek(){
        return this.head.data;
    }
    pop(){
        if(this.empty()) return;
        if(this.len === 1) this.head = this.tail = null;
        else {
            this.head = this.head.next;
            this.head.prev = null;
        }
        this.len -= 1;
    }
    clear(){
        this.head = this.tail = null;
        this.len = 0;
    }
    test(){
        if(this.empty()){
            console.log('Queue: empty');
            return;
        }
        var curr = this.head;
        console.log('Queue');
        while(curr != null){
            console.log(`nxt: ${curr.data}`);
            curr = curr.next;
        }
    }
}
