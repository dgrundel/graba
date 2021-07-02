import { createAction, createReducer, PayloadAction } from '@reduxjs/toolkit'

export interface AppState {
    feeds: string[],
}

const initialState: AppState = {
    feeds: [],
};

enum ActionName {
    SetFeeds = 'config/setFeeds',
};

export const setFeeds = createAction<string[]>(ActionName.SetFeeds);

export const configReducer = createReducer(initialState, {
    [setFeeds.toString()]: (state: AppState, action: PayloadAction<string[]>) => {
        // createReducer uses immer, so the passed-in state is mutable
        state.feeds = action.payload;
    },
});