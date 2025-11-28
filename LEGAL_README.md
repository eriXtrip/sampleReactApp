# Legal Documentation Guide

This README explains how to prepare, implement, and maintain the two core legal documents for your app:
- Terms and Conditions ("Terms")
- Privacy Policy ("Privacy Policy")

Use this guide to create screens in the app, keep your documents up to date, and align with common legal and platform expectations. Replace placeholders like MQuest, matatag and company, matatagquest@gmail.com, philippines jurisdiction, and Nov 28, 2025 with your details.


## Quick Start: Add Legal Screens to the App

1) Create screens (suggested paths):
- app/legal/terms.jsx
- app/legal/privacy.jsx

2) Add titles in your navigator if needed (Expo Router auto-detects routes):
- Navigate to: /legal/terms
- Navigate to: /legal/privacy

3) Link from login/registration:
- "By continuing, you agree to our Terms and acknowledge our Privacy Policy."
- Link Terms to /legal/terms and Privacy to /legal/privacy.

4) Display “Last Updated” and version:
- Show a small note at the top: "Last updated: Nov 28, 2025"
- Keep a change log at the bottom.


## Terms and Conditions — Outline and Guidance

The Terms define the rules for using MQuest. Below is a recommended structure and notes for each section.

1. Acceptance of Terms
- State that by using MQuest or creating an account, the user agrees to the Terms.
- If users are minors, require parental/guardian consent where applicable.

2. Eligibility
- Specify minimum age (e.g., 13+) or applicable local requirement.
- If the app is used in schools, clarify that student access may be provisioned by a school or teacher.

3. Accounts and Security
- Users must provide accurate information and keep credentials secure.
- Report suspicious or unauthorized access promptly.

4. Permitted and Prohibited Use
- Permitted: lawful, personal/educational use.
- Prohibited: reverse engineering, scraping, spamming, harassment, hate speech, IP infringement, attempting to bypass security, or using the service to violate laws.

5. Content and Intellectual Property
- Your Content: users retain ownership of content they provide; grant matatag and company a limited license to host/display it for the service.
- Our Content: MQuest, branding, code, and app assets are owned by matatag and company and licensed to users for use only within the app.

6. Third-Party Links and In-App Browser
- The app may open external sites (including via an in-app browser). External content is governed by third-party terms and policies.
- Disclaim responsibility for third-party sites.

7. Payments (if applicable)
- Explain subscription plans, trials, billing cycles, refunds, and cancellation rules.

8. Communications and Notifications
- Describe in-app, push, or email communications for updates, security alerts, and critical notices.

9. Privacy
- Reference the Privacy Policy for data practices (collection, use, sharing, retention, rights).

10. Disclaimers
- Provide the app “as is” without warranties beyond those required by law.

11. Limitation of Liability
- Limit liability to the maximum extent permitted by law; exclude indirect or consequential damages to the extent allowed.

12. Indemnification
- Users agree to indemnify matatag and company for losses arising from violations of the Terms or misuse of the Service.

13. Termination
- Reserve the right to suspend or terminate accounts for violations, security risks, or legal requests.

14. Changes to Terms
- State that Terms may be updated and that continued use after changes constitutes acceptance.

15. Governing Law and Dispute Resolution
- Specify philippines jurisdiction and any arbitration or venue.

16. Contact
- Provide contact details: matatagquest@gmail.com, and optionally a postal address.


## Privacy Policy — Outline and Guidance

The Privacy Policy explains what information you collect, why, and how you handle it. Tailor this to your actual data flows.

1. Introduction
- Identify the entity responsible for MQuest (matatag and company) and the scope of the policy.

2. Information We Collect
- Provided by users: name, email, profile details, educational identifiers (e.g., LRN), teacher ID, avatar image.
- Collected automatically: device info, OS/app version, usage analytics, crash logs, IP address, push token.
- From third parties (if any): identity providers, analytics SDKs.

3. How We Use Information
- Provide and operate MQuest; authenticate users; personalize content; save progress; send notifications.
- Maintain security, debug issues, measure performance, and improve features.

4. Legal Bases (if applicable under GDPR/EEA)
- Consent, contract performance, legitimate interests, compliance with legal obligations.

5. Sharing and Disclosure
- Service providers (hosting, database, analytics, notifications, storage).
- Legal compliance requests and protection against fraud/security threats.
- Business transfers (merger, acquisition). 
- With user consent (e.g., optional integrations).

6. Data Storage, Security, and Retention
- Describe where data is stored (e.g., cloud regions), what safeguards you use, and retention periods or criteria.
- Note local storage in the app (e.g., secure credentials, offline database, cached files) and platform features like secure keystore.

7. Children’s Privacy (if applicable)
- If the app is used in schools or by minors, outline verifiable parental consent processes and school/teacher authorization where needed.

8. International Transfers
- Explain safeguards for cross-border transfers (e.g., SCCs) if data leaves the user’s country.

9. Your Rights
- Depending on jurisdiction: access, correction, deletion, portability, restriction, objection, and consent withdrawal.
- How to exercise rights: matatagquest@gmail.com.

10. Cookies/Device Identifiers
- Explain the use of device identifiers, push tokens, analytics SDKs, and how users can opt out or change settings.

11. Changes to This Policy
- Describe how updates will be communicated and where new versions will be posted.

12. Contact
- Provide matatagquest@gmail.com and any DPO/contact where applicable.


## Implementation Notes Specific to This App

- In-App Browser: The app can open external sites within the app or via a browser modal. External sites are governed by their own terms and privacy policies.
- Offline Data: The app maintains an offline database and may sync data when connectivity is available.
- Credentials: Authentication tokens are stored securely using the platform’s secure storage.
- Files and Media: The app may download and store files (e.g., avatars, lessons) to local storage for offline use.
- Notifications: The app may send local or push notifications for account, progress, and system updates.

Ensure your policy reflects these behaviors with accurate details about what is stored, where, and for how long.


## Example Headings You Can Paste Into Screens

Use these as templates in your legal screens and replace placeholders with your information.

---
### Terms and Conditions for MQuest
Last Updated: Nov 28, 2025

1. Acceptance of Terms
2. Eligibility
3. Accounts and Security
4. Permitted and Prohibited Use
5. Content and Intellectual Property
6. Third-Party Links and In-App Browser
7. Payments (if applicable)
8. Communications and Notifications
9. Privacy
10. Disclaimers
11. Limitation of Liability
12. Indemnification
13. Termination
14. Changes to Terms
15. Governing Law and Dispute Resolution
16. Contact

---
### Privacy Policy for MQuest
Last Updated: Nov 28, 2025

1. Introduction
2. Information We Collect
3. How We Use Information
4. Legal Bases (GDPR)
5. Sharing and Disclosure
6. Data Storage, Security, and Retention
7. Children’s Privacy
8. International Transfers
9. Your Rights
10. Cookies/Device Identifiers
11. Changes to This Policy
12. Contact


## Navigation Examples (Expo Router)

- Open Terms screen:
  - Path: /legal/terms
- Open Privacy screen:
  - Path: /legal/privacy

In UI copy, link using your navigation methods. Example text: “By continuing, you agree to the Terms and acknowledge the Privacy Policy.”


## Maintenance, Versioning, and Change Log

- Keep a version number and date at the top of each document.
- Maintain a simple change log at the bottom (e.g., “v1.1 — Updated data retention details”).
- When you materially change either document, notify users in-app and/or via email where appropriate.


## Compliance Tips (Non-Exhaustive)

- Children/Students: If minors use the app, implement parental consent and school authorization processes where required.
- GDPR/EEA: Document legal bases, add a Data Protection contact, and describe rights requests processes.
- CCPA/CPRA (California): Include rights to know, delete, and opt-out of sale/share where applicable.
- COPPA (US Children): If under-13 users are involved, ensure verifiable parental consent and limited data collection.
- Security: Use secure storage for tokens, TLS for network traffic, and apply least-privilege access controls.


## Contact

Include your support and privacy contact details in both documents:
- General support: matatagquest@gmail.com
- Privacy requests: matatagquest@gmail.com
- Address (optional but recommended): [ADDRESS]


## Disclaimer

This README provides general information and example structures only and does not constitute legal advice. Consult with qualified counsel to tailor your Terms and Privacy Policy to your specific product, jurisdiction, and data practices.
