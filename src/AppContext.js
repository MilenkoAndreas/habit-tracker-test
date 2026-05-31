import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadHabits, saveHabits, loadLogs, saveLogs, loadChallenge, saveChallenge, dateKey, loadNotificationPrefs, saveNotificationPrefs } from './storage';
import { LIGHT_COLORS, DARK_COLORS } from './theme';

const AppContext = createContext(null);

const initialState = {
  habits: [],
  logs: [],
  challenge: null,
  darkMode: false,
  notificationPrefs: {
    enabled: true,
    morning: { enabled: true, hour: 9, minute: 0 },
    evening: { enabled: true, hour: 19, minute: 0 },
  },
  loading: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'HYDRATE':
      return { ...state, ...action.payload, loading: false };

    case 'ADD_HABIT': {
      const habits = [...state.habits, action.habit];
      saveHabits(habits);
      return { ...state, habits };
    }

    case 'UPDATE_HABIT': {
      const habits = state.habits.map(h => h.id === action.habit.id ? action.habit : h);
      saveHabits(habits);
      return { ...state, habits };
    }

    case 'DELETE_HABIT': {
      const habits = state.habits.filter(h => h.id !== action.id);
      const logs = state.logs.filter(l => l.habitId !== action.id);
      saveHabits(habits);
      saveLogs(logs);
      return { ...state, habits, logs };
    }

    case 'LOG_HABIT': {
      const entry = {
        id: Date.now().toString(),
        habitId: action.habitId,
        date: dateKey(),
        completedAt: new Date().toISOString(),
      };
      const logs = [...state.logs, entry];
      saveLogs(logs);
      return { ...state, logs };
    }

    case 'UNLOG_HABIT': {
      const today = dateKey();
      let idx = -1;
      for (let i = state.logs.length - 1; i >= 0; i--) {
        if (state.logs[i].habitId === action.habitId && state.logs[i].date === today) {
          idx = i;
          break;
        }
      }
      if (idx === -1) return state;
      const logs = [...state.logs.slice(0, idx), ...state.logs.slice(idx + 1)];
      saveLogs(logs);
      return { ...state, logs };
    }

    case 'SET_CHALLENGE': {
      saveChallenge(action.challenge);
      return { ...state, challenge: action.challenge };
    }

    case 'COMPLETE_CHALLENGE': {
      const challenge = { ...state.challenge, completed: true };
      saveChallenge(challenge);
      return { ...state, challenge };
    }

    case 'CLEAR_TODAY_LOGS': {
      const today = dateKey();
      const logs = state.logs.filter(l => l.date !== today);
      saveLogs(logs);
      return { ...state, logs };
    }

    case 'COMPLETE_ALL_TODAY': {
      const today = dateKey();
      const base = state.logs.filter(l => l.date !== today);
      const newLogs = [];
      state.habits.forEach(h => {
        for (let i = 0; i < h.targetCount; i++) {
          newLogs.push({ id: `${Date.now()}_${h.id}_${i}`, habitId: h.id, date: today, completedAt: new Date().toISOString() });
        }
      });
      const logs = [...base, ...newLogs];
      saveLogs(logs);
      return { ...state, logs };
    }

    case 'COMPLETE_PAST_DAYS': {
      const base = Date.now();
      let counter = 0;
      let logs = [...state.logs];
      for (let i = 1; i <= action.days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const date = dateKey(d);
        logs = logs.filter(l => l.date !== date);
        state.habits.forEach(h => {
          for (let j = 0; j < h.targetCount; j++) {
            logs.push({ id: `${base}_${counter++}`, habitId: h.id, date, completedAt: new Date().toISOString() });
          }
        });
      }
      saveLogs(logs);
      return { ...state, logs };
    }

    case 'SET_NOTIFICATION_PREFS': {
      saveNotificationPrefs(action.prefs);
      return { ...state, notificationPrefs: action.prefs };
    }

    case 'WIPE_ALL': {
      saveHabits([]);
      saveLogs([]);
      saveChallenge(null);
      return { ...state, habits: [], logs: [], challenge: null };
    }

    case 'TOGGLE_DARK_MODE': {
      const darkMode = !state.darkMode;
      AsyncStorage.setItem('darkMode', darkMode ? 'true' : 'false');
      return { ...state, darkMode };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    Promise.all([
      loadHabits(),
      loadLogs(),
      loadChallenge(),
      AsyncStorage.getItem('darkMode').then(v => v === 'true'),
      loadNotificationPrefs(),
    ]).then(([habits, logs, challenge, darkMode, notificationPrefs]) => {
      dispatch({ type: 'HYDRATE', payload: { habits, logs, challenge, darkMode, notificationPrefs } });
    });
  }, []);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}

export function useApp() {
  return useContext(AppContext);
}

export function useColors() {
  const { state } = useContext(AppContext);
  return state.darkMode ? DARK_COLORS : LIGHT_COLORS;
}
