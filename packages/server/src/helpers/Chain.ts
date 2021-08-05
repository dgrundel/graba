type ProcessorResult<R> = Promise<R | undefined>;
type ChainProcessor<T, R> = (t: T, prev?: R) => ProcessorResult<R>;

export class Chain<T, R = T> {
    private readonly processor: ChainProcessor<T, R>;
    private link: ProcessorResult<R>;
    private ended: boolean = false;

    constructor(processor: ChainProcessor<T, R>, initialValue?: R | ProcessorResult<R>) {
        this.processor = processor;
        this.link = Promise.resolve(initialValue);

        this.put = this.put.bind(this);
        this.end = this.end.bind(this);
    }

    put(t: T) {
        if (this.ended) {
            return;
        }
        this.link = this.link.then((prev?: R) => this.processor(t, prev));
    }

    end(): ProcessorResult<R> {
        if (this.ended) {
            return Promise.reject('Chain has already ended');
        }
        this.ended = true;
        return new Promise(resolve => this.link.then(resolve));
    }

    isEnded(): boolean {
        return this.ended;
    }
}