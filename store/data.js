import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const initialState = {
	address: "0x0000000000000000000000000000000000000000",
	version: "v2",
	position: {
		data: [],
		loading: false,
		error: null,
	},
	listPositions: {
		data: [],
		loading: false,
		error: null,
	},
	portfolio: {
		data: [],
		loading: false,
		error: null,
	},
	searchToken: {
		data: [],
		loading: false,
		error: null,
	},
};

export const fetchPosition = createAsyncThunk(
	"datas/fetchPosition",
	async ({ owner, pairAddress, protocolVersion }) => {
		const res = await fetch("/api/getPosition", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ owner, pairAddress, protocolVersion }),
		});

		if (!res.ok) throw new Error("Failed to fetch position");
		return await res.json();
	}
);

export const fetchListPositions = createAsyncThunk(
	"datas/fetchListPositions",
	async ({ address }) => {
		const res = await fetch("/api/listPositions", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ address }),
		});

		if (!res.ok) throw new Error("Failed to fetch list positions");
		return await res.json();
	}
);

export const fetchPortfolio = createAsyncThunk(
	"datas/fetchPortfolio",
	async ({ address }) => {
		const res = await fetch("/api/portfolio", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ address }),
		});

		if (!res.ok) throw new Error("Failed to fetch portfolio");
		return await res.json();
	}
);

export const fetchSearchToken = createAsyncThunk(
	"datas/fetchSearchToken",
	async ({ tokenAddress }) => {
		const res = await fetch("/api/searchToken", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ tokenAddress }),
		});

		if (!res.ok) throw new Error("Failed to search token");
		return await res.json();
	}
);

const datas = createSlice({
	name: "Datas",
	initialState,
	reducers: {
		setAddress: (state, action) => {
			state.address = action.payload;
		},
		setVersion: (state, action) => {
			state.version = action.payload;
		},
	},
	extraReducers: (builder) => {
		builder
			.addCase(fetchPosition.pending, (state) => {
				state.position.loading = true;
				state.position.error = null;
			})
			.addCase(fetchPosition.fulfilled, (state, action) => {
				state.position.loading = false;
				state.position.data = action.payload;
				state.position.error = null;
			})
			.addCase(fetchPosition.rejected, (state, action) => {
				state.position.loading = false;
				state.position.error = action.error.message;
			})
			.addCase(fetchListPositions.pending, (state) => {
				state.listPositions.loading = true;
				state.listPositions.error = null;
			})
			.addCase(fetchListPositions.fulfilled, (state, action) => {
				state.listPositions.loading = false;
				state.listPositions.data = action.payload;
				state.listPositions.error = null;
			})
			.addCase(fetchListPositions.rejected, (state, action) => {
				state.listPositions.loading = false;
				state.listPositions.error = action.error.message;
			})
			.addCase(fetchPortfolio.pending, (state) => {
				state.portfolio.loading = true;
				state.portfolio.error = null;
			})
			.addCase(fetchPortfolio.fulfilled, (state, action) => {
				state.portfolio.loading = false;
				state.portfolio.data = action.payload;
				state.portfolio.error = null;
			})
			.addCase(fetchPortfolio.rejected, (state, action) => {
				state.portfolio.loading = false;
				state.portfolio.error = action.error.message;
			})
			.addCase(fetchSearchToken.pending, (state) => {
				state.searchToken.loading = true;
				state.searchToken.error = null;
			})
			.addCase(fetchSearchToken.fulfilled, (state, action) => {
				state.searchToken.loading = false;
				state.searchToken.data = action.payload;
				state.searchToken.error = null;
			})
			.addCase(fetchSearchToken.rejected, (state, action) => {
				state.searchToken.loading = false;
				state.searchToken.error = action.error.message;
			});
	},
});

export default datas.reducer;
