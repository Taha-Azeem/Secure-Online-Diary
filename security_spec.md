# Security Specification - CipherDiary

## Data Invariants
1. **User Profiles:** A user can only create and modify their own profile. Admin roles cannot be self-assigned during registration.
2. **Diary Entries:** Only the owner of an entry can read, update, or purge it. Ciphertext integrity must be maintained.
3. **Activity Logs:** Logs are append-only for the system/user. They cannot be modified or deleted.
4. **Security Logs:** System-generated logs for tracking threats. Users have no write access to these.
5. **Notifications:** Users can only read their own notifications.

## The "Dirty Dozen" (Attack Payloads)
1. **Admin Escalation:** Registering with `role: "admin"`.
2. **Identity Spoofing:** Creating a record with an `ownerId` that doesn't match the authenticated UID.
3. **Record Hijacking:** Attempting to read another user's encrypted entry using its ID.
4. **Log Tampering:** Updating an existing activity log entry to hide a breach.
5. **Shadow Fields:** Adding an `isVerified: true` hidden field to a user profile.
6. **Denial of Wallet:** Injecting a 1MB string into an entry ID or category name.
7. **Malicious Purge:** Attempting to delete another user's diary entry.
8. **Impersonation Log:** Writing a security log entry claiming a failure was a success.
9. **Notification Spam:** Creating notifications for other users.
10. **Cross-User Leak:** Listing all records in the `entries` collection without an owner filter.
11. **Timestamp Forgery:** Providing a client-side `createdAt` time that is in the future.
12. **Protocol Nullification:** Updating an entry and setting its `securityLevel` to "UNSECURED".

## Test Suite Summary
The `firestore.rules` will be tested against these payloads to ensure `PERMISSION_DENIED` is returned for all unauthorized operations.
