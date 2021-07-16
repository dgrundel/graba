
export type ChainProcessor<T, R> = (t: T, prev?: R) => Promise<R | undefined>;

export class Chain<T, R = T> {
    private link: Promise<R | undefined>;
    private readonly processor: ChainProcessor<T, R>;

    constructor(processor: ChainProcessor<T, R>, initialValue?: R) {
        this.processor = processor;
        this.link = Promise.resolve(initialValue);

        this.put = this.put.bind(this);
    }

    put(t: T) {
        this.link = this.link.then((prev?: R) => this.processor(t, prev));
    }
}