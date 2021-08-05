type ProcessorResult<R> = Promise<R | undefined>;
type ChainProcessor<T, R> = (t: T, prev?: R) => ProcessorResult<R>;

export class Chain<T, R = T> {
    private readonly processor: ChainProcessor<T, R>;
    private link: ProcessorResult<R>;
    private isEnded: boolean = false;

    constructor(processor: ChainProcessor<T, R>, initialValue?: R | ProcessorResult<R>) {
        this.processor = processor;
        this.link = Promise.resolve(initialValue);

        this.put = this.put.bind(this);
    }

    put(t: T) {
        if (this.isEnded) {
            return;
        }
        this.link = this.link.then((prev?: R) => this.processor(t, prev));
    }

    end(): ProcessorResult<R> {
        this.isEnded = true;
        return new Promise(resolve => this.link.then(resolve));
    }
}