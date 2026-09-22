// Hosting platforms may set HOSTNAME to the container name. The public server
// must listen on every interface, while retaining the platform-provided PORT.
process.env.HOSTNAME = "0.0.0.0";

console.log("PORT:", process.env.PORT);
console.log("HOSTNAME:", process.env.HOSTNAME);

await import("../.next/standalone/server.js");
