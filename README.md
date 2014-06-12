croupier
========

Croupier.JS: an HTTP Brokerless Bus
Croupier is a small daemon (or client library, TBD) that easily adds fault-tolerance, horizontal scalability to your current HTTP backend-to-backend interactions.

When to use croupier
--------------------
Before having croupier, you probably implemented some HTTP based backend to backend interactions. 
Those are working well, but now you want to be able to add more servers for Fault-Tolerance and Horizontal Scalability.

You may have though of solutions like HA proxy, but this usually need to be configured, and be restarted when configuration changes (eg. adding a new server).

Croupier allows you adding new servers that start receiving requests right away. No config, no restarts, just plug and play.


installing
----------
You will need node.js and npm.

```bash
git clone git@github.com:javierarilos/croupier.git
cd croupier
npm install
```

running the example
-------------------
```bash
echo to be able to see something in the logs, each server should be run in its own cosole

echo running croupier
node croupier.js 8000

echo running the sample servers
echo server in port 8008
node sample-croupier-server.js 10.95.139.221 8008

echo server in port 8009
node sample-croupier-server.js 10.95.139.221 8009

echo running sample client
node sample-croupier-client.js localhost 8000
```

Pending work
------------
Croupier is still a work in progress.
* Architecture decission: croupier should be a separate daemon process or a client-library wrapping standard http?  
Features
* Monitoring and administration: monitoring of croupier and providers (requests handled, response times, ongoing requests, ...
* HTTP on steroids: handle redeliveries, TTL, Throttling...
* Load balancing: now each request is forwarded to a random server. More intelligent approaches can be followed (eg: number of current requests, response time degraded, ...)
* On start, croupier should send a message to discover all providers. Now, this is done by receiving the publisher status sent by providers.


