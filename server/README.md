
## TODO:

- Move server responses to functions 
- Test http-proxy
- TD hydration implementation in AppStore component w/keys par & json load - model after app-store-init

SSL

- How to run iPad w/SSL for a webcam, but then proxy all non-SSL connections? Is that possible?

Nice-to-haves?

- Java/Haxademic updates 
  - Add heartbeat to Java client
  - Add sender to Java client
  - Add receiver to Java client
  - Add ws?sender= queryparam to Java client
  - Store sender in AppStoreDistributed for incoming messages
- Monitor/frontend
  - app-store-init init-keys should accept `*` for all keys
  - add "expected_clients" list to app-store-clients, and show a red row if a client is missing
  - QR code somewhere to launch BA app (or any link for a client app)
  - Client list last message sent time?
  - Filter event table by client?
  - Add these to the client storage? or maybe just keep these in the Monitor?
    - Add `sender` to JS table (added to AppStoreDistributed via `getData()`)
    - Add `sender` to TD table
  - Click to resend a key/value?
  - Add a button to wipe the store (it will repopulate as messages come in)
  - Can we send a message to remove a key on the clients?
- ws-relay
  - chatroom option to separate channels?
- In `/state`, can we filter rather than just return entire or single key?

