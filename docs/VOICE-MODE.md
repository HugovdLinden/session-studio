# Gerd subscription voice

Start the local companion, open http://127.0.0.1:5181/ and click the pet. This feature needs Codex signed in with your own ChatGPT account and an installed version supporting experimental native v3 voice. Ordinary development mode and the hosted group site do not supply this connection.

1. Open **Microphone & voice** beside the chat controls.
2. Choose the microphone. **Find microphones** may request browser permission so names can be listed. **Test microphone** shows the input level for six seconds; that test saves no recording.
3. Choose a conversational voice. These are supplied by Codex's native voice service, separate from browser read-aloud voices. The choice is remembered.
4. Click the main microphone to start. Speak English when the status says listening. Use **Mute microphone**, the speaker button, or the main microphone to stop.
5. Stop before switching microphones or voices. Closing the companion also stops the call. Calls have a 15-minute limit.

**Test voice connection without microphone** opens the connection with no captured input and requests a brief greeting. It checks connection/output only; a real human must still test their microphone, recognition and audible voice quality. If browser playback is blocked, click the speaker button to enable replies. A successful input-level test alone does not prove remote voice recognition works.

## Website actions and conversation

Voice uses the existing private Gerd conversation and current project references. A request to change the website is delegated to the backing agent, validated, applied through the same permitted controls as text, then verified against the updated screen. The microphone pauses while this work runs. Incomplete speech never executes an edit. Stale controls or invalid structured replies are rejected. Completed changes are not undone by stopping a call.

Project context still belongs in `graduation-context/`. No specialist facilitator skill was added by this change. The session-running screen remains outside this build. Speak explicitly when you want a project created, deleted or a session started; normal application confirmations still apply.

## Account, privacy and limits

- Only ChatGPT account authentication and native WebRTC transport are used. No API key, separately billed Realtime API path, automatic purchase or paid fallback is configured.
- The bridge checks included allowance before starting and during a call. Exhausted or unverifiable allowance stops voice. Account-level purchasing settings remain controlled by ChatGPT; concurrent account use may change limits while a call runs.
- Audio is sent to the native OpenAI voice service during the call. The app does not save raw recordings. Final transcripts are saved in the existing ignored private companion history; do not upload it or credentials.
- A call belongs to one local browser connection. Closing, stopping, disconnecting or reaching its limit releases microphone tracks and playback. Keep the bridge on loopback; never expose the development server publicly.
- This Codex interface is experimental. An update or account limitation may remove availability. Failures must remain visible; do not silently switch to API billing or robotic browser speech.

## Verification boundary

The native account/voice probe and microphone-free WebRTC negotiation succeeded. The browser reached a connected state in Codex's preview, but repeated microphone-free calls then ended with a native `transport_closed` event before sustained speech/output could be verified. Omitting live-context updates did not resolve that; a v2 native transport check also failed. Native voice is therefore experimental and not yet proven usable on this installation. Microphone selection and level testing are available independently. No claim of working end-to-end voice should be made from connection negotiation alone. Automated tests cover account refusal, allowance exhaustion, native-only transport, call ownership, validated action replies and final-only transcript persistence. Physical microphone quality, spoken command interpretation and audible naturalness still require a user test.

References: [Codex App Server](https://learn.chatgpt.com/docs/app-server), [OpenAI Codex implementation](https://github.com/openai/codex/blob/main/codex-rs/core/src/realtime_conversation.rs). This app uses the installed experimental Codex transport rather than a standalone API-key implementation.
