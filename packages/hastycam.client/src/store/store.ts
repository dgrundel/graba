import { configureStore } from '@reduxjs/toolkit';
import { configReducer } from './reducers/configReducer';

const reducer = {
    config: configReducer,
};

export const store = configureStore({
    reducer
});

export type RootState = ReturnType<typeof store.getState>

console.log('Initial state: ', store.getState());

store.subscribe(() => console.log('State after dispatch: ', store.getState()));