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
    server.listen(port, "0.0.0.0", () => {
      console.log(`Azure Bay API listening on http://0.0.0.0:${port}`);
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
