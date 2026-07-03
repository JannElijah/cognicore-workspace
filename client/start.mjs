import { createServer } from 'vite'; createServer().then(server => server.listen()).then(server => server.printUrls()).catch(err => console.error(err));
