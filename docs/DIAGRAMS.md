# System Diagrams

Architecture diagrams for common Oversite deployment patterns.

---

## Simple Show Controller (Local LAN)

A desktop app runs as the primary show controller. The Oversite server runs on the same machine. An iPad on the local network is a second AppStore client — both devices stay in sync via WebSocket broadcast.

```mermaid
graph TD
    subgraph desktop ["Desktop Machine (local network)"]
        APP["Desktop App (AppStore client)"]
        SERVER["Oversite Server :3003"]
        APP -- "ws://localhost:3003/ws" --> SERVER
    end

    subgraph ipad ["iPad (local network)"]
        TABLET["iPad App (AppStore client)"]
    end

    TABLET -- "ws://{local-ip}:3003/ws" --> SERVER
    SERVER -- "broadcast state" --> APP
    SERVER -- "broadcast state" --> TABLET
```

**What this enables:** The iPad can act as a show control panel — setting AppStore keys that the desktop app reacts to, and vice versa. Either device can drive state changes; all clients see every update.

---

## Complex Multi-Machine Installation

All of the above, plus: the primary desktop app posts check-ins to a cloud-hosted Dashboard API, an ESP32 microcontroller streams sensor values into the AppStore over the local network, and a second desktop on a different machine is also an AppStore client — both desktops stay in sync through the shared server.

```mermaid
graph TD
    subgraph lan ["Local Network"]
        subgraph desktop1 ["Desktop Machine A"]
            APP1["Desktop App A (AppStore client)"]
            SERVER["Oversite Server :3003"]
            APP1 -- "ws://localhost:3003/ws" --> SERVER
        end

        subgraph desktop2 ["Desktop Machine B"]
            APP2["Desktop App B (AppStore client)"]
        end

        subgraph ipad ["iPad"]
            TABLET["iPad App (AppStore client)"]
        end

        subgraph esp ["ESP32"]
            MCU["ESP32 (AppStore client)"]
        end

        APP2 -- "ws://{local-ip}:3003/ws" --> SERVER
        TABLET -- "ws://{local-ip}:3003/ws" --> SERVER
        MCU -- "ws://{local-ip}:3003/ws" --> SERVER
        SERVER -- "broadcast state" --> APP1
        SERVER -- "broadcast state" --> APP2
        SERVER -- "broadcast state" --> TABLET
        SERVER -- "broadcast state" --> MCU
    end

    subgraph cloud ["Cloud (DigitalOcean)"]
        DASH["Dashboard API (check-in endpoint)"]
    end

    APP1 -- "HTTP POST check-in" --> DASH
```

**What this enables:**
- Desktop A and Desktop B share all AppStore state in real time — a value set on one is immediately reflected on the other
- The iPad provides a show control UI accessible without touching either desktop
- The ESP32 streams sensor/accelerometer data into the AppStore as named keys; all clients can read those values
- The cloud Dashboard provides remote visibility (last-seen, uptime, screenshots) for the whole installation
