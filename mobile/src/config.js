// Android emulators can't reach your laptop via "localhost" - 10.0.2.2 is the
// special address Android's emulator uses to mean "the host machine's localhost".
// A real physical phone can't reach either of those - it needs your laptop's actual
// LAN IP (e.g. 192.168.x.x), or better, the deployed Render URL once that's live.
//
// Swap this single line when you deploy - nothing else in the app needs to change.
export const API_BASE_URL = 'https://konvo-media-locker.onrender.com';

// Once Render is live, change the line above to something like:
// export const API_BASE_URL = 'https://your-app-name.onrender.com';
