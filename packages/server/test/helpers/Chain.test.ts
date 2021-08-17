import { Chain } from '../../src/helpers/Chain';

test('silly chain test', () => {
    const result = [];
    const processor = async (n: number) => {
        result.push(n);
        return n;
    }
    
    const chain = new Chain(processor, -1);
    
    chain.put(1);
    chain.put(2);
    chain.put(3);

    chain.end().then((last?: number) => {
        expect(last).toBe(3);
    });

});