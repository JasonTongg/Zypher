import { createSlice } from "@reduxjs/toolkit";

const initialState = {
	balance: "0",
};

const datas = createSlice({
	name: "Datas",
	initialState,
	reducers: {
		setBalance(state, action) {
			state.balance = action.payload;
		},
	},
});

export default datas.reducer;

export const { setBalance } = datas.actions;
