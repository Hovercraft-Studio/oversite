import { useState, useEffect } from "react";

export const useAppStore = (storeKey, options) => {
  options = options || {};
  const { defaultValue = null, onUpdate } = options;
  const [value, setValue] = useState(_store.get(storeKey) || defaultValue);

  useEffect(() => {
    const obj = {
      storeUpdated: (k, v) => {
        if (k === storeKey) {
          setValue(v);
          if (onUpdate) onUpdate(v);
        }
      },
    };
    _store.addListener(obj);
    return () => _store.removeListener(obj);
  }, [storeKey, onUpdate]);

  // pass broadcast=false to keep the value in the local _store without broadcasting over websockets
  const setStoreValue = (value, broadcast = true) => {
    _store.set(storeKey, value, broadcast);
  };

  return [value, setStoreValue];
};

// standalone function to set values in the store when the other hook logic is not needed
export const setValue = (key, value, broadcast = true) => {
  _store.set(key, value, broadcast);
};
