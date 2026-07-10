"use client";

import {
  createContext,
  useContext,
  useReducer,
  type ReactNode,
  type Dispatch,
} from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FarmInputs {
  N: number;
  P: number;
  K: number;
  temperature: number;
  humidity: number;
  ph: number;
  rainfall: number;
  crop: string;
}

export interface CouncilOutputs {
  crop_recommender: Record<string, any> | null;
  fertilizer: Record<string, any> | null;
  soil_health: Record<string, any> | null;
  yield_predictor: Record<string, any> | null;
  irrigation: Record<string, any> | null;
  growth_stage: Record<string, any> | null;
  pest_identifier: Record<string, any> | null;
}

export interface CouncilState {
  farmInputs: FarmInputs;
  councilOutputs: CouncilOutputs;
  synthesis: string | null;
  isLoading: boolean;
  error: string | null;
}

/* ------------------------------------------------------------------ */
/*  Actions                                                            */
/* ------------------------------------------------------------------ */

export type CouncilAction =
  | { type: "SET_FARM_INPUTS"; payload: Partial<FarmInputs> }
  | {
      type: "SET_COUNCIL_RESPONSE";
      payload: {
        councilOutputs: Partial<CouncilOutputs>;
        synthesis?: string | null;
      };
    }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "RESET" };

/* ------------------------------------------------------------------ */
/*  Initial state                                                      */
/* ------------------------------------------------------------------ */

const initialState: CouncilState = {
  farmInputs: {
    N: 65,
    P: 45,
    K: 70,
    temperature: 28,
    humidity: 75,
    ph: 6.5,
    rainfall: 150,
    crop: "rice",
  },
  councilOutputs: {
    crop_recommender: null,
    fertilizer: null,
    soil_health: null,
    yield_predictor: null,
    irrigation: null,
    growth_stage: null,
    pest_identifier: null,
  },
  synthesis: null,
  isLoading: false,
  error: null,
};

/* ------------------------------------------------------------------ */
/*  Reducer                                                            */
/* ------------------------------------------------------------------ */

function councilReducer(
  state: CouncilState,
  action: CouncilAction
): CouncilState {
  switch (action.type) {
    case "SET_FARM_INPUTS":
      return {
        ...state,
        farmInputs: { ...state.farmInputs, ...action.payload },
      };

    case "SET_COUNCIL_RESPONSE":
      return {
        ...state,
        councilOutputs: {
          ...state.councilOutputs,
          ...action.payload.councilOutputs,
        },
        synthesis: action.payload.synthesis ?? state.synthesis,
        error: null,
      };

    case "SET_LOADING":
      return { ...state, isLoading: action.payload };

    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

/* ------------------------------------------------------------------ */
/*  Context + Provider + Hook                                          */
/* ------------------------------------------------------------------ */

const CouncilContext = createContext<
  | {
      state: CouncilState;
      dispatch: Dispatch<CouncilAction>;
    }
  | undefined
>(undefined);

export function CouncilProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(councilReducer, initialState);

  return (
    <CouncilContext.Provider value={{ state, dispatch }}>
      {children}
    </CouncilContext.Provider>
  );
}

export function useCouncil() {
  const context = useContext(CouncilContext);
  if (!context) {
    throw new Error("useCouncil must be used within a CouncilProvider");
  }
  return context;
}
