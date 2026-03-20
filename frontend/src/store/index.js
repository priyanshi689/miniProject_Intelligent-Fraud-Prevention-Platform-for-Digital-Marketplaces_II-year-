import { configureStore } from '@reduxjs/toolkit';
import fraudReducer from './fraudSlice';
export const store = configureStore({ reducer: { fraud: fraudReducer } });
