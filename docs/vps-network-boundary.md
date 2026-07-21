# VPS network boundary

`db/schema.sql` ships without row-level security. The justification written into
that file is that the database is not reachable from the internet and the only
client is the application itself. This document is what makes that sentence
true, because when it was first written it was false.

## What was wrong

The VPS runs ufw with a default-deny inbound policy allowing only 22, 80 and
443. That policy did not apply to containers. Docker installs its own DNAT and
FORWARD rules ahead of ufw's, so every published container port was reachable
from the internet regardless of what ufw said.

Measured, not assumed: with ufw active and reporting those three ports,
`http://37.59.123.31:6001/` answered `200 OK` from outside the machine.
Port 6002 answered as well.

No Postgres container published a port at that moment, so the database was
in fact unreachable — but by accident, not by design. A single
`ports: 5432:5432` in a future compose file would have put the `workspaces`
table on the public internet with no RLS behind it.

## What enforces it now

`infra/vps/docker-user-firewall.sh`, installed on the VPS at
`/usr/local/sbin/` and run by `infra/vps/docker-user-firewall.service`.

The policy is default-deny in the `DOCKER-USER` chain: traffic arriving on the
public interface for any container is dropped unless it is a reply to a
connection the container opened, or it was addressed to port 80 or 443. Docker
never flushes `DOCKER-USER`, which is why the policy belongs there.

The unit is `After`, `Requires` and `PartOf` `docker.service`, and is wanted by
it, so the rules are reinstalled whenever the daemon starts, including at boot.
This host has no `iptables-persistent`; without the unit the rules would vanish
on the next reboot and nothing would say so.

## Three things that are easy to get wrong here

**Match the pre-DNAT port.** Docker rewrites the destination in `PREROUTING`,
so by the time `DOCKER-USER` runs, the destination port is the *container's*
port, not the published one. A rule saying `--dport 80 -j RETURN` does not mean
"allow the web"; it means "allow any container that listens on 80 internally,
published on any host port whatsoever". The first version of this policy had
exactly that bug: a canary container published as `5432:80` remained reachable
from the internet, answering `200`, with the policy supposedly in force. The
correct match is `conntrack --ctorigdstport`, which is the port the client
actually addressed.

**IPv6 is a separate firewall.** The host has a public IPv6 address and its
`ip6tables` `FORWARD` chain is wired identically to the IPv4 one. A policy
applied to only one family closes one door and leaves the neighbouring one open
while looking finished.

**Established traffic must return first.** Replies to connections a container
opened arrive on the public interface too. Without a leading
`--ctstate RELATED,ESTABLISHED -j RETURN`, every outbound container connection
dies on its first response packet.

## Why this cannot lock you out

`DOCKER-USER` is only reached from the `FORWARD` chain, so it only ever sees
traffic being routed to a container. Host services — SSH above all — arrive
through `INPUT` and are never evaluated against it. The same scoping keeps the
Coolify dashboard and its realtime service reachable over the tailnet, since
that traffic arrives on `tailscale0` rather than the public interface.

## How to verify it, from outside the machine

The check that matters is not "is 6001 closed" but "does a newly published port
start out closed". Run a canary and confirm it is published for real before
concluding anything from a failed connection:

```sh
# on the VPS
docker run -d --rm --name fw-canary -p 5432:80 nginx:alpine
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:5432/   # expect 200

# from anywhere else
curl -s -m 8 -o /dev/null -w '%{http_code}\n' http://37.59.123.31:5432/   # expect a timeout

# on the VPS
docker stop fw-canary
```

A canary that is not actually serving makes the external timeout meaningless,
which is why the local `200` comes first.

## Known gap

Propagation on a real `docker.service` restart has not been exercised. The
wiring is in place and the script is idempotent, but the machine hosts
third-party sites and a daemon restart bounces every container. Verify it at a
moment when that downtime is acceptable, and confirm afterwards that
`iptables -S DOCKER-USER` still lists the policy rather than an empty chain.
