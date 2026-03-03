# Infrastructure Quick Reference

Quick diagnostics for infrastructure issues. For full investigation, use `/atlas`.

## Quick Diagnostics

hnc-devops has a lightweight infra reference:
```
/hnc/dev/sidecars/hnc-devops/infra-reference.md
```

## Full Infrastructure Agent

Use `/atlas` to invoke **infra-sage** (Atlas the Infrastructure Sage).

infra-sage has:
- Full topology of all 20+ LXCs
- Complete network configuration
- Learned patterns from past investigations
- NPM management capabilities
- Proxmox host-level access

## Quick Commands

```bash
# Check NPM logs
ssh hmserv1 "pct exec 210 -- docker logs nginx-proxy-manager --tail 30"

# Test NPM can reach Traefik
ssh hmserv1 "pct exec 210 -- curl -s -H 'Host: hncms-labels.scarif-0.duckdns.org' http://192.168.137.80/health"

# Check DNS resolution
dig hncms-labels.scarif-0.duckdns.org +short
```
