import "./App.css";
import { useAppStore } from "./hooks/useAppStore";

function App() {
  const [mouseX, setMouseX] = useAppStore("MOUSE_X", { defaultValue: 0 });
  const [mouseY, setMouseY] = useAppStore("MOUSE_Y", { defaultValue: 0 });

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMouseX(x);
    setMouseY(y);
  };

  return (
    <div className="App">
      <h1>React AppStore Demo</h1>
      <p>You can use AppStore in React!</p>
      <p>
        To test these components, open the AppStore Demo page and see the values
        change there as you interact with buttons here and vice versa.
      </p>
      <hr />
      <section>
        <h2>React Hook</h2>
        <p>
          You can use the <code>useAppStore</code> React hook to roll your own
          components connected to the AppStore.
        </p>
        <div
          style={{
            width: "100%",
            backgroundColor: "white",
            border: "3px dashed black",
            borderRadius: "0.5rem",
            height: "20rem",
            cursor: "crosshair",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseMove={handleMouseMove}
        >
          <p style={{ color: "gray" }}>
            Hover to change <code>MOUSE_X</code> and <code>MOUSE_Y</code> values
            in AppStore.
          </p>
        </div>
      </section>
      <hr />
      <section>
        <h2>Web Components</h2>
        <p>
          You can use the provided web components directly in your React
          components (if you are using React 19 or later).
        </p>
        <section>
          <h3>
            Buttons with shared key: app_state ={" "}
            <code>
              <app-store-element store-key="app_state"></app-store-element>
            </code>
          </h3>
          <nav>
            <app-store-button store-key="app_state" value="attract">
              Attract
            </app-store-button>
            <app-store-button store-key="app_state" value="gameplay">
              Gameplay
            </app-store-button>
            <app-store-button store-key="app_state" value="game_over">
              Game Over
            </app-store-button>
          </nav>
        </section>
        <section>
          <h3>Input Fields</h3>
          <p>
            <label>app-store-textfield</label>
            <app-store-textfield
              store-key="text_input"
              value=""
            ></app-store-textfield>
          </p>
          <p>
            <label>app-store-slider</label>
            <label>
              slider_1:{" "}
              <code>
                <app-store-element
                  store-key="slider_1"
                  flash-on-update
                ></app-store-element>
              </code>
            </label>
            <app-store-slider
              store-key="slider_1"
              value="0"
              max="1"
            ></app-store-slider>
          </p>
          <p>
            <label>app-store-checkbox</label>
            <app-store-checkbox store-key="checkbox_1">
              Checkbox 1
            </app-store-checkbox>
          </p>
        </section>
      </section>
    </div>
  );
}

export default App;
