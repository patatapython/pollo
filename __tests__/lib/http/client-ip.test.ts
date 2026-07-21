import { describe, it, expect } from 'vitest';
import { parseClientIp } from '@/lib/http/client-ip';

/**
 * The rate limiter keys on this value. Two properties matter: a client must not
 * be able to change its key by varying the proxy chain, and anything that is
 * not an address must become null rather than reaching an inet column.
 */
describe('parseClientIp', () => {
  it('takes the client, not the proxy chain', () => {
    // The bypass this closes: the same client arriving through different
    // chains counted as different addresses, so the limit could be walked past.
    expect(parseClientIp('203.0.113.7, 70.41.3.18, 150.172.238.178')).toBe('203.0.113.7');
    expect(parseClientIp('203.0.113.7')).toBe('203.0.113.7');
  });

  it('is not fooled by whitespace in the chain', () => {
    expect(parseClientIp('  203.0.113.7  ,10.0.0.1')).toBe('203.0.113.7');
  });

  it('returns null when there is no usable address', () => {
    // The literal 'unknown' used to be stored here. Against an inet column it
    // breaks the read that runs before authentication, not just the write.
    expect(parseClientIp(null)).toBeNull();
    expect(parseClientIp('')).toBeNull();
    expect(parseClientIp('unknown')).toBeNull();
    expect(parseClientIp('not-an-address, 1.2.3.4')).toBeNull();
    expect(parseClientIp('999.999.999.999')).toBeNull();
  });

  it('accepts IPv6, with or without brackets and port', () => {
    expect(parseClientIp('2001:db8::1')).toBe('2001:db8::1');
    expect(parseClientIp('[2001:db8::1]:443')).toBe('2001:db8::1');
  });

  it('strips a port from an IPv4 address', () => {
    expect(parseClientIp('203.0.113.7:54321')).toBe('203.0.113.7');
  });
});
