#!/bin/sh
# Default-deny for container ports published on the public interface.
#
# Docker inserts its own DNAT and FORWARD rules ahead of ufw, so a published
# port is reachable from the internet even though ufw only allows 22/80/443.
# Verified: port 6001 answered from the internet with ufw active.
#
# DOCKER-USER is evaluated before Docker's own accept rules and Docker never
# flushes it, so it is the correct place for this policy. Everything arriving
# on the public interface for a container is dropped unless it is a reply to a
# connection the container opened, or it was addressed to the published web
# ports.
#
# MATCH THE PRE-DNAT PORT, NOT --dport. Docker DNATs in PREROUTING, so by the
# time this chain runs the destination port is the CONTAINER port, not the
# published one. A plain "--dport 80" therefore does not mean "the web": it
# means "any container listening on 80 internally, published on any port at
# all". That was measured, not reasoned: a canary published as 5432:80 stayed
# reachable from the internet under that rule. conntrack --ctorigdstport
# matches the port the client actually addressed, which is the intent.
#
# This chain only sees forwarded traffic. Host services -- SSH above all --
# go through INPUT and are unaffected, so this cannot lock anyone out.
#
# Scope is the public interface only: docker bridges and tailscale0 are
# untouched, which keeps the Coolify dashboard and realtime reachable over
# the tailnet.
set -eu

PUBLIC_IF=ens3

install_rules() {
    ipt=$1
    "$ipt" -N DOCKER-USER 2>/dev/null || true
    "$ipt" -F DOCKER-USER

    # Replies to connections the containers opened. Without this, every
    # outbound container connection dies on its first response packet.
    "$ipt" -A DOCKER-USER -i "$PUBLIC_IF" -m conntrack \
        --ctstate RELATED,ESTABLISHED -j RETURN

    # IPv6 needs ICMPv6 open: path MTU discovery and neighbour discovery
    # depend on it. Harmless on IPv4, where the RELATED rule above already
    # carries the ICMP errors that matter.
    if [ "$ipt" = ip6tables ]; then
        "$ipt" -A DOCKER-USER -i "$PUBLIC_IF" -p icmpv6 -j RETURN
    fi

    for port in 80 443; do
        "$ipt" -A DOCKER-USER -i "$PUBLIC_IF" -p tcp -m conntrack \
            --ctorigdstport "$port" -j RETURN
    done
    "$ipt" -A DOCKER-USER -i "$PUBLIC_IF" -p udp -m conntrack \
        --ctorigdstport 443 -j RETURN

    "$ipt" -A DOCKER-USER -i "$PUBLIC_IF" -j DROP
    "$ipt" -A DOCKER-USER -j RETURN
}

install_rules iptables
install_rules ip6tables
