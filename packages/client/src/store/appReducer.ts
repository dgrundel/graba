import { MessageBarType } from '@fluentui/react';
import { createAction, createReducer, PayloadAction } from '@reduxjs/toolkit';
import React from 'react';

export interface AppMessage {
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

export const appReducer = createReducer(initialState, {
    [addMessage.toString()]: (state: AppState, action: PayloadAction<AppMessage>) => {
        console.log('app reducer', action);
        return { 
            ...state, 
            messages: state.messages.concat(action.payload) 
        };
    },
})