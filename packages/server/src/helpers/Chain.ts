
export type ChainProcessor<T, R> = (t: T, prev?: R) => Promise<R | undefined>;

export class Chain<T, R = T> {
    private link: Promise<R | undefined>;
    private readonly processor: ChainProcessor<T, R>;
    private run: Promise<void> = Promise.resolve();
    private doResume?: () => void;

    constructor(processor: ChainProcessor<T, R>, initialValue?: R) {
        this.processor = processor;
        this.link = Promise.resolve(initialValue);

        this.put = this.put.bind(this);
    }

    put(t: T) {
        this.link = this.link.then((prev?: R) => {
            return this.run.then(() => this.processor(t, prev));
        });
    }

    stop() {
        this.run = new Promise(resolve => {
            this.doResume = resolve;
        });
    }

    start() {
        if (this.doResume) {
            this.doResume();
            this.doResume = undefined;
        }
    }
}