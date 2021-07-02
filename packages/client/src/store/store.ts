import { createStore } from 'redux';
import { appReducer } from './reducers/appReducer';

export const store = createStore(appReducer);

console.log('Initial state: ', store.getState());

store.subscribe(() => console.log('State after dispatch: ', store.getState()));