# Local integration preview and Gerd

The integration preview uses port 5184. The original companion stays on port 5181 and owns the existing conversation and graduation-context folder. The preview forwards only `/api/gerd` to that local companion; it never copies or concurrently writes the companion history files.

Keep the original companion running with its existing launcher. In this integration copy, launch the preview in PowerShell with:

```powershell
$env:SESSION_STUDIO_COMPANION='0'
$env:SESSION_STUDIO_COMPANION_UPSTREAM='http://127.0.0.1:5181/'
npm run dev -- --host 127.0.0.1 --port 5184 --strictPort
```

Use **Reconnect assistant** in Gerd's panel after restarting the companion. It checks the connection again and reloads the existing conversation; it keeps the unsent message. Reconnecting stops an active voice call so it can be restarted with the fresh connection.

The forwarding plugin runs only during local development. It accepts loopback clients with the preview's own origin, passes through the companion's session token, and refuses external upstream destinations. It adds no paid AI API service or API key. Ordinary subscription limits still apply.

Projects and board storage remain separate between ports 5181 and 5184. Reconnecting the assistant does not migrate project data.

If confirmation fails, the specific save or planning validation error now appears next to **Confirm planning**. Incomplete multi-stage methods still require all their documented stages in the correct order. Add/move the missing stages or remove an unwanted method run; the application does not bypass these checks or silently change the agenda.

Verification: type checking passed; 129 automated tests passed; browser checks confirmed Gerd reconnects, conversational voice choices load without the former raw validation error, valid plans advance to the confirmed screen, and invalid staged plans show their precise reason beside Confirm. Live microphone capture and spoken audio were not retested in this fix.
