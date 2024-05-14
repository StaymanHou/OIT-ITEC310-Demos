import { v4 as uuidv4 } from 'uuid';
import { createSlice } from '@reduxjs/toolkit'

const currentPlayerSlice = createSlice({
  name: 'currentPlayer',
  initialState: {
    id: uuidv4(),
    ign: '',
  },
  reducers: {
    regenCurrentPlayerId(state, action) {
      state.id = uuidv4();
    },
    setCurrentPlayerIGN: {
      reducer(state, action) {
        const { ign } = action.payload;
        state.ign = ign;
      },
      prepare(ign) {
        return { payload: { ign } };
      }
    }
  }
})

const selectCurrentPlayerId = state => state.currentPlayer.id;
const selectCurrentPlayerIGN = state => state.currentPlayer.ign;

export { selectCurrentPlayerId, selectCurrentPlayerIGN };

export const { regenCurrentPlayerId, setCurrentPlayerIGN } = currentPlayerSlice.actions;

export default currentPlayerSlice.reducer;
