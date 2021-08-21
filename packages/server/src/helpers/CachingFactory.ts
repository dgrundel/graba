import deepEq from 'deep-equal';

const eq = <T>(a: T, b: T) => deepEq(a, b, { strict: true })

type Producer<A, R> = (arg: A) => R;

export class CachingFactory<A, R> {
    private readonly argProducer: Producer<void, A>;
    private readonly factory: Producer<A, R>;
    
    private prevArg?: A;
    private instance?: R;

    constructor(argProducer: Producer<void, A>, factory: Producer<A, R>) {
        this.argProducer = argProducer;
        this.factory = factory;
    }

    get() {
        const updated: A = this.argProducer();
        
        if (!this.instance || !this.prevArg || !eq(this.prevArg, updated)) {
            this.prevArg = updated;
            this.instance = this.factory(updated);
        }

        return this.instance;
    }
}