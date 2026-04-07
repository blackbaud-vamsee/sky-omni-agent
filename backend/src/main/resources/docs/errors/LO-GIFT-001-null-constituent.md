# Error Pattern: Luminate Online — Gift Processing NullReferenceException

## Error ID: LO-GIFT-001
## System: Luminate Online (LO) → Raiser's Edge NXT Gift API
## Severity: HIGH

---

## Raw Log Sample
```
[2026-03-14 09:22:31] ERROR GiftProcessingService - Unhandled exception during gift commit
com.blackbaud.luminate.gifts.GiftProcessingService.commitGift(GiftProcessingService.java:247)
java.lang.NullPointerException: Cannot invoke "com.blackbaud.re.api.GiftRecord.getConstituent()" because "giftRecord" is null
    at com.blackbaud.luminate.gifts.GiftProcessingService.commitGift(GiftProcessingService.java:247)
    at com.blackbaud.luminate.gifts.GiftProcessingService.processOnlineGift(GiftProcessingService.java:189)
    at com.blackbaud.luminate.controller.DonationController.submitDonation(DonationController.java:112)
Caused by: com.blackbaud.re.api.exception.ConstituentNotFoundException: No constituent found for email: donor@example.com
    at com.blackbaud.re.api.ConstituentLookupService.lookupByEmail(ConstituentLookupService.java:88)
```

---

## Root Cause
The `GiftProcessingService` attempts to create a gift record before verifying that the constituent
lookup succeeded. When `ConstituentLookupService.lookupByEmail()` returns `null` (constituent not
found in RE database), the code proceeds to call `.getConstituent()` on a null `GiftRecord`, causing NPE.

This occurs when:
1. A new online donor submits a gift whose email address has never been in Raiser's Edge
2. The constituent auto-creation feature is disabled or failed silently in a prior step

---

## Fix
Add a null-check and constituent creation fallback before calling `commitGift`:

```java
// BEFORE (broken):
GiftRecord giftRecord = reApiClient.createGift(donationRequest);
giftRecord.getConstituent().validate(); // NPE if constituent not found

// AFTER (fixed):
ConstituentRecord constituent = constituentLookupService.lookupByEmail(donationRequest.getEmail());
if (constituent == null) {
    constituent = constituentService.createMinimalConstituent(
        donationRequest.getFirstName(),
        donationRequest.getLastName(),
        donationRequest.getEmail()
    );
    log.info("Auto-created constituent for new donor: {}", donationRequest.getEmail());
}
GiftRecord giftRecord = reApiClient.createGift(donationRequest, constituent.getId());
```

---

## Prevention
- Add integration tests that cover "new donor" (no existing constituent) path
- Enable `luminate.gifts.auto-create-constituent=true` in Luminate config as default
