import { configureStore } from '@reduxjs/toolkit';
import { appReducer } from './appReducer';

export const store = configureStore({
    reducer: {
        app: appReducer,
    }
});

store.subscribe(() => console.log('store update', store.getState()));

export type RootState = ReturnType<typeof store.getState>;