  /*
        Function to open the official Neutralino documentation in the default web browser.
        (Example: lists files in current dir)
    */
        async openDocs() {
          try {
            let info = await Neutralino.os.execCommand("ls");
            console.log(`ls command output: ${info.stdOut}`);
            console.log(`ls command full info: ${JSON.stringify(info)}`);
            Neutralino.os.showMessageBox("Command Output", `Output of 'ls':\n${info.stdOut}`);
          } catch (err) {
            console.error("Error executing command:", err);
            Neutralino.os.showMessageBox("Error", `Failed to execute command: ${err.message}`);
          }
        }
      
        async openDocs2() {
          // Neutralino.os.open("https://neutralino.js.org/docs");
          console.log("Pinging neutralino.js.org...");
          try {
            // Storing pingProc to manage it if needed, though current logic is self-contained per call
            let pingProc = await Neutralino.os.spawnProcess("ping -c 5 neutralino.js.org"); // Ping 5 times for demo
            this.pingProcId = pingProc.id;
      
            // Handle events for this specific spawned process
            const handler = (evt) => {
              if (this.pingProcId === evt.detail.id) {
                switch (evt.detail.action) {
                  case "stdOut":
                    console.log(`Ping output: ${evt.detail.data}`);
                    break;
                  case "stdErr":
                    console.error(`Ping error: ${evt.detail.data}`);
                    break;
                  case "exit":
                    console.log(`Ping process terminated with exit code: ${evt.detail.data}`);
                    // Clean up listener for this specific process
                    Neutralino.events.off("spawnedProcess", handler);
                    if (this.pingProcId === evt.detail.id) this.pingProcId = null;
                    break;
                }
              }
            };
            Neutralino.events.on("spawnedProcess", handler);
          } catch (err) {
            console.error("Error spawning ping process:", err);
            Neutralino.os.showMessageBox("Error", `Failed to spawn ping process: ${err.message}`);
          }
        }
      