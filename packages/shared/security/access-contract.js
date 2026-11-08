/* Shared client-side access contract. Never grants licenses or devices locally.
 * All authoritative checks must be enforced by Supabase RPC/RLS.
 */
(function (root) {
  'use strict';
  const isUuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const normalized = value => typeof value === 'string' ? value.trim() : '';
  root.ZAVI_SHARED_ACCESS = Object.freeze({
    isUuid,
    normalized,
    requireAuthenticatedUser(user) {
      if (!user || !isUuid(user.id)) throw new Error('Authentication required');
      return user.id;
    },
    async callAuthoritativeRpc(client, functionName, args) {
      if (!client || typeof client.rpc !== 'function') throw new Error('Supabase client required');
      if (!/^[a-z][a-z0-9_]+$/i.test(functionName)) throw new Error('Invalid RPC name');
      const result = await client.rpc(functionName, args || {});
      if (result.error) throw result.error;
      return result.data;
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
