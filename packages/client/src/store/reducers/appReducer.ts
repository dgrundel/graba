export interface AppState {
    feeds: string[],
}

interface AppAction {
    type: string;
}

export interface SetFeedsAction extends AppAction {
    type: 'setFeeds',
    feeds: string[],
}

const initialState: AppState = {
    feeds: [],
}

export function appReducer(state: AppState = initialState, action: AppAction): AppState {
    switch (action.type) {
        case 'setFeeds':
            const setFeedsAction = action as SetFeedsAction;
            return {
                ...state,
                feeds: setFeedsAction.feeds,
            };
        default:
            return state
    }
}