export class LimitCounter {
    private readonly max: number;
    private counter: number = 0;

    constructor(max: number) {
        this.max = max;
    }

    hasReachedLimit() {
        return this.counter >= this.max;
    }

    increment() {
        if (!this.hasReachedLimit()) {
            this.counter++;
        }
    }

    reset() {
        this.counter = 0;
    }
}
