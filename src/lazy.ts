export class Lazy<T> {
    private initializedValue: T | undefined;

    constructor(private initializer: () => Promise<T>) {}

    async get(): Promise<T> {
        return (this.initializedValue ??= await this.initializer());
    }
}
