import { Validator } from '../../src/validator/Validator';

interface TestObject {
    str?: string;
    num?: number;
    bool?: boolean;
}

const names: Record<keyof TestObject, string> = {
    str: 'STRING',
    num: 'NUMBER',
    bool: 'BOOLEAN',
};

describe('Validator', () => {

    describe('strings', () => {
        test('detects undefined strings as empty', () => {
            const obj: TestObject = {};
        
            const errs = Validator.of(obj, names)
                .notEmpty('str')
                .getErrors();
            
            expect(errs).toStrictEqual([{ key: 'str', message: 'STRING cannot be empty' }]);
        });
        
        test('detects empty strings as empty', () => {
            const obj: TestObject = { str: '' };
        
            const errs = Validator.of(obj, names)
                .notEmpty('str')
                .getErrors();
            
            expect(errs).toStrictEqual([{ key: 'str', message: 'STRING cannot be empty' }]);
        });
        
        test('non-empty strings pass', () => {
            const obj: TestObject = { str: 'hello' };
        
            const errs = Validator.of(obj, names)
                .notEmpty('str')
                .getErrors();
            
            expect(errs).toStrictEqual([]);
        });

        test('non-numeric strings not numeric', () => {
            const obj: TestObject = { str: 'hello' };
        
            const errs = Validator.of(obj, names)
                .notEmpty('str')
                .numeric('str')
                .getErrors();
            
            expect(errs).toStrictEqual([{ key: 'str', message: 'STRING must be numeric' }]);
        });

        test('numeric strings numeric', () => {
            const obj: TestObject = { str: '42' };
        
            const errs = Validator.of(obj, names)
                .notEmpty('str')
                .numeric('str')
                .getErrors();
            
            expect(errs).toStrictEqual([]);
        });
    });
    
    describe('numbers', () => {
        test('gte when gte', () => {
            const obj: TestObject = { num: 10 };
        
            const errs = Validator.of(obj, names)
                .notEmpty('num')
                .numeric('num')
                .greaterThanOrEq('num', 5)
                .getErrors();
            
            expect(errs).toStrictEqual([]);
        });

        test('gte when NOT gte', () => {
            const obj: TestObject = { num: 1 };
        
            const errs = Validator.of(obj, names)
                .notEmpty('num')
                .numeric('num')
                .greaterThanOrEq('num', 5)
                .getErrors();
            
            expect(errs).toStrictEqual([{ key: 'num', message: 'NUMBER must be greater than or equal to 5' }]);
        });

        test('lte when lte', () => {
            const obj: TestObject = { num: 10 };
        
            const errs = Validator.of(obj, names)
                .notEmpty('num')
                .numeric('num')
                .lessThanOrEq('num', 50)
                .getErrors();
            
            expect(errs).toStrictEqual([]);
        });

        test('lte when NOT lte', () => {
            const obj: TestObject = { num: 100 };
        
            const errs = Validator.of(obj, names)
                .notEmpty('num')
                .numeric('num')
                .lessThanOrEq('num', 50)
                .getErrors();
            
            expect(errs).toStrictEqual([{ key: 'num', message: 'NUMBER must be less than or equal to 50' }]);
        });
    });

    describe('conditionals', () => {
        test('when w/ false', () => {
            const obj: TestObject = { bool: false, num: 10 };
        
            const errs = Validator.of(obj, names)
                .when(obj.bool, v => {
                    v.greaterThanOrEq('num', 100);
                })
                .getErrors();
            
            expect(errs).toStrictEqual([]);
        });

        test('when w/ true', () => {
            const obj: TestObject = { bool: true, num: 10 };
        
            const errs = Validator.of(obj, names)
                .when(obj.bool, v => {
                    v.greaterThanOrEq('num', 100);
                })
                .getErrors();
            
            expect(errs).toStrictEqual([{ key: 'num', message: 'NUMBER must be greater than or equal to 100' }]);
        });

        test('when w/ passing nested validator', () => {
            const obj: TestObject = { str: 'hello', num: 10 };
        
            const errs = Validator.of(obj, names)
                .when(v => {
                    v.notEmpty('str');
                }, v => {
                    v.greaterThanOrEq('num', 100);
                })
                .getErrors();
            
            expect(errs).toStrictEqual([{ key: 'num', message: 'NUMBER must be greater than or equal to 100' }]);
        });

        test('when w/ failing nested validator', () => {
            const obj: TestObject = { str: undefined, num: 10 };
        
            const errs = Validator.of(obj, names)
                .when(v => {
                    v.notEmpty('str');
                }, v => {
                    v.greaterThanOrEq('num', 100);
                })
                .getErrors();
            
            expect(errs).toStrictEqual([{ key: 'str', message: 'STRING cannot be empty' }]);
        });
    });
});




// const vc = (config: Config) => {
//     return Validator.of(config, Config.FIELD_NAMES)
//         .when(config.enableEmailAlerts === true, v => {
//             v.notEmpty('smtpServer');
//             v.notEmpty('smtpUser');
//             v.notEmpty('smtpPassword');

//             v.when(typeof config.smtpPort !== 'undefined', v2 => {
//                 v2.numeric('smtpPort')
//             });
//         })
//         .getErrors();
// }


// not empty
// numeric
// gte
// lte