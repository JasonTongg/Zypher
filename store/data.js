import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Initial state
const initialState = {
  address: "0x0000000000000000000000000000000000000000",
  pairAddress: "0x0000000000000000000000000000000000000001",
  twitter: "https://x.com/",
  telegram: "https://t.me/",
  dextoolsUrl: "",
  uniswapUrl: "",
  dexscreenerUrl: "",
  balance: "0",
};

// Create async thunks for fetching URLs
export const fetchUniswap = createAsyncThunk(
  "data/fetchUniswap",
  async (address) => {
    return `https://app.uniswap.org/swap?inputCurrency=ETH&outputCurrency=${address}`;
  }
);

export const fetchDextools = createAsyncThunk(
  "data/fetchDextools",
  async (address) => {
    return `https://www.dextools.io/app/en/ether/pair-explorer/${address}`;
  }
);

export const fetchDexscreener = createAsyncThunk(
  "data/fetchDexscreener",
  async (address) => {
    return `https://dexscreener.com/ethereum/${address}`;
  }
);

// Create the slice
const datas = createSlice({
  name: "Datas",
  initialState,
  reducers: {
    setBalance(state, action) {
      state.balance = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUniswap.fulfilled, (state, action) => {
        state.uniswapUrl = action.payload;
      })
      .addCase(fetchDextools.fulfilled, (state, action) => {
        state.dextoolsUrl = action.payload;
      })
      .addCase(fetchDexscreener.fulfilled, (state, action) => {
        state.dexscreenerUrl = action.payload;
      });
  },
});

// Export the reducer
export default datas.reducer;

export const { setBalance } = datas.actions;
