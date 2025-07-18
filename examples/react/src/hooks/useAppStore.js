import { useState, useEffect } from "react";

/**
 * React hook for subscribing to and updating AppStore values.
 *
 * @param {string} storeKey - A string that identifies the value in the store.
 *                           Usually all caps (with underscores for spaces), like "COLOR" or "TIME_LEFT".
 * @param {Object} [options] - Optional configuration object
 * @param {*} [options.defaultValue=null] - An initial value for this key in local state
 *                                         (not yet published to the store); will default to null.
 * @param {Function} [options.onUpdate] - A callback function that will be called whenever
 *                                       the store key is updated. This code will run every time
 *                                       the store key is updated, even if the value has not changed.
 *
 * @returns {Array} An array with two values:
 *   - [0]: The current value of the store key (always up-to-date with the store)
 *   - [1]: A setter function for that store key value
 *
 * @example
 * // Basic usage
 * const [color, setColor] = useAppStore("COLOR", { defaultValue: "red" });
 *
 * @example
 * // With onUpdate callback
 * const onColorUpdate = (value) => {
 *   console.log("color updated:", value);
 * };
 * const [color, setColor] = useAppStore("COLOR", {
 *   defaultValue: "red",
 *   onUpdate: onColorUpdate,
 * });
 *
 * @example
 * // Using with useEffect for change detection
 * const [color, setColor] = useAppStore("COLOR");
 * useEffect(() => {
 *   console.log("color changed:", color);
 * }, [color]); // This only runs when the value actually changes
 *
 * @example
 * // Complete component example
 * const MyComponent = () => {
 *   const [color, setColor] = useAppStore("COLOR", { defaultValue: "red" });
 *
 *   return (
 *     <div style={{ backgroundColor: color }}>
 *       <button onClick={() => setColor("blue")}>Blue</button>
 *       <button onClick={() => setColor("purple")}>Purple</button>
 *       <button onClick={() => setColor("red")}>Red</button>
 *     </div>
 *   );
 * };
 *
 * @note onUpdate vs useEffect:
 * - Use the `onUpdate` option to run code any time the store value is updated (even if unchanged)
 * - Use a `useEffect` hook with the value as a dependency to run code only when the value changes
 */
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

/**
 * Standalone function to set values in the store when the hook logic is not needed.
 * Useful for setting store values from outside of React components or when you don't
 * need to subscribe to the value.
 *
 * @param {string} key - The store key to set
 * @param {*} value - The value to set in the store
 * @param {boolean} [broadcast=true] - Whether to broadcast the value over websockets.
 *                                    Pass false to keep the value in the local _store
 *                                    without broadcasting over websockets.
 *
 * @example
 * // Set a value and broadcast it
 * setValue("COLOR", "blue");
 *
 * @example
 * // Set a value locally without broadcasting
 * setValue("COLOR", "blue", false);
 */
export const setValue = (key, value, broadcast = true) => {
  _store.set(key, value, broadcast);
};
