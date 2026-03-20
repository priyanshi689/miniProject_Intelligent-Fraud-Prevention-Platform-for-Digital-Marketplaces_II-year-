import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { transactionAPI, fraudAPI, caseAPI } from '../services/api';

export const fetchSummary = createAsyncThunk('fraud/fetchSummary', async () => {
  const res = await transactionAPI.getSummary();
  return res.data.data;
});

export const fetchTransactions = createAsyncThunk('fraud/fetchTransactions', async (params) => {
  const res = await transactionAPI.getAll(params);
  return res.data;
});

export const fetchTrend = createAsyncThunk('fraud/fetchTrend', async (days = 7) => {
  const res = await fraudAPI.getTrend({ days });
  return res.data.data;
});

export const fetchCases = createAsyncThunk('fraud/fetchCases', async (params) => {
  const res = await caseAPI.getAll(params);
  return res.data;
});

export const fetchDistribution = createAsyncThunk('fraud/fetchDistribution', async () => {
  const res = await fraudAPI.getDistribution();
  return res.data.data;
});

const fraudSlice = createSlice({
  name: 'fraud',
  initialState: {
    summary: null, transactions: [], cases: [], trend: [], distribution: [],
    pagination: {}, loading: false, error: null
  },
  reducers: {
    addLiveAlert: (state, action) => {
      state.transactions.unshift(action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSummary.fulfilled, (s, a) => { s.summary = a.payload; })
      .addCase(fetchTransactions.fulfilled, (s, a) => { s.transactions = a.payload.data; s.pagination = a.payload.pagination; })
      .addCase(fetchTrend.fulfilled, (s, a) => { s.trend = a.payload; })
      .addCase(fetchCases.fulfilled, (s, a) => { s.cases = a.payload.data; })
      .addCase(fetchDistribution.fulfilled, (s, a) => { s.distribution = a.payload; })
      .addMatcher(a => a.type.endsWith('/pending'), (s) => { s.loading = true; s.error = null; })
      .addMatcher(a => a.type.endsWith('/fulfilled'), (s) => { s.loading = false; })
      .addMatcher(a => a.type.endsWith('/rejected'), (s, a) => { s.loading = false; s.error = a.error.message; });
  }
});

export const { addLiveAlert } = fraudSlice.actions;
export default fraudSlice.reducer;
