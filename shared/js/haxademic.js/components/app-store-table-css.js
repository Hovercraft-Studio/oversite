const css = /*css*/ `

:root {
  --table-font-size: 1.2vw;
}

/* table row animations */

@keyframes flash-anim {
  0% {
    background-color: rgba(0, 255, 0, 0.5);
  }
  30% {
    background-color: rgba(0, 255, 0, 0.5);
  }
  100% {
    background-color: transparent;
  }
}

@keyframes flash-anim-heartbeat {
  0% {
    background-color: rgba(255, 255, 255, 0.1);
  }
  30% {
    background-color: rgba(255, 255, 255, 0.1);
  }
  100% {
    background-color: transparent;
  }
}

@keyframes heartbeat-anim {
  0% {
    transform: scale(1);
  }
  10% {
    transform: scale(1.5);
  }
  100% {
    transform: scale(1);
  }
}

/* table styles */

app-store-table,
app-store-event-table,
app-store-clients {

  /* add horiz scroll if table is too wide */
  display: block;
  overflow-x: auto;

  table {
    max-width: 100%;
    font-size: var(--table-font-size);
  }
  tr.error {
    background-color: rgba(255, 0, 0, 0.5);
  }
  th,
  td {
    padding: calc(var(--pico-spacing) / 4) calc(var(--pico-spacing) / 6);
    overflow: hidden;
    background-color: transparent;
    color: inherit;

    white-space: nowrap;
    /* line-break: anywhere;
    white-space: break-spaces; */
  }
  .heartbeat span svg path {
    fill: var(--pico-primary-background);
  }
  .heartbeat span svg,
  .row-actions .delete svg {
    pointer-events: none;
    width: calc(1.5 * var(--table-font-size));
    height: calc(1.5 * var(--table-font-size));
    display: inline-block;
  }
  .row-actions .delete path {
    fill: var(--pico-primary-background);
  }
  .row-actions {
    text-align: center;
    span {
      cursor: pointer;
    }
  }
  .flash {
    animation: flash-anim 2s 1;
  }
  [data-row-type="heartbeat"].flash {
    animation: flash-anim-heartbeat 1.5s 1;
  }
  .heartbeat td.heartbeat span {
    display: inline-block;
    transform-origin: center center;
    animation: heartbeat-anim 1.5s 1;
  }
}

/* responsive table layout */

@media screen and (max-width: 959px) {
  app-store-table table,
  app-store-event-table table,
  app-store-clients table {
    font-size: calc(1.7 * var(--table-font-size));
  }
}

/* special table elements */

/* pico input override w/ :not */
app-store-event-table
  input:not([type="checkbox"], [type="radio"], [type="range"]) {
  font-size: 0.7rem;
  padding: 0.5rem;
  height: 2rem;
}

/* events table  */
app-store-event-table .grid.filters {
  /* pico responsive override - always keep 2 columns */
  grid-template-columns: repeat(auto-fit, minmax(0%, 1fr));
  font-size: 12px !important;
  align-items: end;
}

[hide-filters] .filters {
  display: none;
}

`;

export default css;
