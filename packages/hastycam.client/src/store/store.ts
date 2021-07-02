import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { configReducer } from './reducers/configReducer';
import { persistStore, persistReducer } from 'redux-persist'
import { FetchStorage } from './fetchStorage';

const persistConfig = {
    key: 'root',
    storage: new FetchStorage('http://localhost:4000/config/'),
}

const reducer = persistReducer(persistConfig, combineReducers({
    config: configReducer,
}));

export const store = configureStore({
    reducer
});
export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>

// debug logging to console
console.log('Initial state: ', store.getState());
store.subscribe(() => console.log('State after dispatch: ', store.getState()));