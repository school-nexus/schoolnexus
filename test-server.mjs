import next from 'next';
import { createServer } from 'http';
import { parse } from 'url';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing Next.js server startup...');

const app = next({
  dev: false,
  dir: path.join(__dirname),
  conf: {
    output: 'standalone',
    env: {
      NODE_ENV: 'production'
    }
  }
});

const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    console.log('Next.js app prepared successfully');
    
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    server.listen(3000, (err) => {
      if (err) throw err;
      console.log('> Ready on http://localhost:3000');
    });
  })
  .catch((ex) => {
    console.error(ex.stack);
    process.exit(1);
  });