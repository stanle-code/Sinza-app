# Security Specification for Sinza SDA Sabbath School

## 1. Data Invariants

1. **User Identity Invariant**: Users can only create their own user profile (where the document ID matches their auth UID).
2. **Weekly Publication Ownership**: A member can only submit weekly reports under their own name and UID. They cannot submit reports for another member or spoof the author UID.
3. **Role Integrity**: A member cannot self-escalate their role to "admin" or "teacher". Role elevations must be governed by an existing Administrator.
4. **Report Lifecycle**: Only teachers or admins can approve or reject weekly reports. Once approved, members cannot modify their report under normal operations unless overridden by an admin.
5. **Class Assignment Lock**: Members can register and join classes, but assigning teachers to classes is strictly restricted to Administrators.

## 2. The "Dirty Dozen" Payloads (Denial Tests)

1. **Self-Escalation Request**: A member trying to create their profile with `role: "admin"`.
2. **Report Spoofing**: User A trying to save a report with `memberId: "userB"`.
3. **Ghost Class Injection**: Creating a class when not registered with an admin account.
4. **Attendance Forgery**: Standard member trying to submit attendance for their class.
5. **Announcement Spam**: Standard member publishing a global church announcement.
6. **Setting Manipulation**: Trying to modify system settings as a member.
7. **Read PII of Others**: Accessing other users' private settings/preferences from the client.
8. **Approved Report Tampering**: Standard member attempting to edit a report after it has already been approved.
9. **Log Deletion Request**: Attempting to clear `audit_logs` or `activity_logs`.
10. **RSVP Spam**: Attempting to register another user for an event.
11. **Badge Injection**: A user writing a self-awarded badge document.
12. **Class Archiving bypass**: A teacher attempting to archive an entire class (restricted to admins).

Each of these actions must violate the security constraints and safely return `PERMISSION_DENIED` at the Firestore database level.
