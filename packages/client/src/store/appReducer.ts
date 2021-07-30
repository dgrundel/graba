import { MessageBarType } from '@fluentui/react';
import { createAction, createReducer, PayloadAction } from '@reduxjs/toolkit';
import { nanoid } from 'nanoid';
import React from 'react';

const DEFAULT_MESSAGE_HIDE_DELAY = 5000;

export interface AppMessage {
    id?: string;
    type?: MessageBarType;
    body: React.ReactNode;
}

export interface AppState {
    messages: AppMessage[];
}

const initialState: AppState = {
    messages: [],
};

export const addMessage = createAction<AppMessage>('app/addMessage');
export const removeMessage = createAction<string>('app/removeMessage');

export const flashMessage = (message: AppMessage, delay?: number) => {
    return (dispatch: any) => {
        const m = {
            ...message,
            id: message.id || nanoid(),
        };
        
        // add the message
        dispatch(addMessage(m));

        // remove it later
        setTimeout(() => dispatch(removeMessage(m.id)), delay || DEFAULT_MESSAGE_HIDE_DELAY);
    };
};

export const appReducer = createReducer(initialState, {
    [addMessage.toString()]: (state: AppState, action: PayloadAction<AppMessage>) => {
        const message = {
            ...action.payload,
        };
        return { 
            ...state,
            messages: state.messages.concat(message),
        };
    },
    [removeMessage.toString()]: (state: AppState, action: PayloadAction<string>) => {
        const messages = state.messages.slice();
        const i = messages.findIndex(m => m.id === action.payload);
        if (i !== -1) {
            messages.splice(i, 1);
        }
        return { 
            ...state, 
            messages,
        };
    },
})