const http = require("http");
const app = require("./app");
const { port } = require("./config");
const { connectDatabase } = require("./db");
const { seedDatabase } = require("./seed");
const { attachSocket } = require("./sockets");

connectDatabase()
  .then(seedDatabase)
  .then(() => {
    const server = http.createServer(app);
    attachSocket(server);
    server.listen(port, () => {
      console.log(`Azure Bay API listening on http://127.0.0.1:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
