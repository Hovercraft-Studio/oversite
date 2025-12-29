/*
    Custom Web Component to display information about the Neutralino app and computer vitals.
    This component fetches details regarding the running Neutralino application and system hardware,
    and updates its own content with this information when connected to the DOM.
*/
class SystemInfoDisplay extends HTMLElement {
  constructor() {
    super();
    // You can choose to use Shadow DOM for encapsulation if desired
    // this.attachShadow({ mode: 'open' });
    // For simplicity, this example will render directly into the component's light DOM
  }

  async connectedCallback() {
    // This method is called when the element is added to the DOM.
    await this.render();
  }

  async render() {
    let infoHTML = "";
    try {
      const ramUsage = await Neutralino.computer.getMemoryInfo();
      const arch = await Neutralino.computer.getArch();
      const kernelInfo = await Neutralino.computer.getKernelInfo();
      const osInfo = await Neutralino.computer.getOSInfo();
      const cpuInfo = await Neutralino.computer.getCPUInfo();
      const displaysArr = await Neutralino.computer.getDisplays();

      const architecture = arch;
      const os = `${osInfo.name} ${osInfo.version}`;
      const kernel = `${kernelInfo.variant} ${kernelInfo.version}`;
      const cpu = `${cpuInfo.model} (${cpuInfo.physicalCores} cores, ${cpuInfo.logicalThreads} threads)`;
      const ram = `Available: ${(ramUsage.physical.available / (1024 * 1024 * 1024)).toFixed(2)} GB / Total: ${(
        ramUsage.physical.total /
        (1024 * 1024 * 1024)
      ).toFixed(2)} GB`;

      let displays = "";
      if (displaysArr && displaysArr.length > 0) {
        displays = displaysArr
          .map(
            (display, index) =>
              `Display ${index + 1} (ID: ${display.id}): ${display.resolution.width}x${display.resolution.height} @ ${
                display.refreshRate
              }Hz, ${display.bpp}bpp, DPI: ${display.dpi}<br/>`
          )
          .join("");
      } else {
        displays = `N/A`;
      }

      infoHTML = /* html */ `
        <div>
          <article>
            <h3>Computer Vitals</h3>
            <ul>
              <li>Architecture: ${architecture}</li>
              <li>OS: ${os}</li>
              <li>Kernel: ${kernel}</li>
              <li>CPU: ${cpu}</li>
              <li>RAM (Physical): ${ram}</li>
              <li>Displays: ${displays}</li>
            </ul>
          </article>
        </div>
        <hr>
      `;
    } catch (err) {
      console.error("Error getting computer vitals:", err);
      infoHTML = `<strong>Computer Vitals:</strong> Could not retrieve one or more computer vitals.<br/>`;
    }

    this.innerHTML = infoHTML;
  }

  // You might also want to implement disconnectedCallback if you need to clean up anything
  // disconnectedCallback() {
  //   console.log('SystemInfoDisplay component removed from DOM.');
  // }
}

// Define the custom element
// Make sure the name contains a hyphen and is unique
if (!customElements.get("system-info-display")) {
  customElements.define("system-info-display", SystemInfoDisplay);
}

// Export the class if you plan to import it elsewhere, though for self-registering
// components, this is often not strictly necessary if the script is just included.
export default SystemInfoDisplay;
