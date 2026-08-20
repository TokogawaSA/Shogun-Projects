import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

// Initialize db if not already initialized
const db = admin.apps.length > 0 ? admin.firestore() : admin.initializeApp().firestore();

export interface SetUserCustomClaimsRequest {
  targetUid: string;
  tenantId: string;
  role: string;
  profileId: string;
  isTenantAdmin: boolean;
}

export interface SetUserCustomClaimsResponse {
  success: boolean;
  message: string;
  claims: {
    tenantId: string;
    role: string;
    profileId: string;
    isTenantAdmin: boolean;
  };
}

/**
 * Cloud Functions Gen 2 Callable Function: setUserCustomClaims
 * Sets custom auth claims (tenantId, role, profileId, isTenantAdmin) on target Firebase Auth user,
 * and synchronizes the tenant user record under `tenants/{tenantId}/users/{targetUid}`.
 */
export const setUserCustomClaims = onCall<SetUserCustomClaimsRequest, Promise<SetUserCustomClaimsResponse>>(
  async (request) => {
    // 1. Verify Caller Authentication
    if (!request.auth) {
      throw new HttpsError(
        'unauthenticated',
        'Authentication is required to perform administrative operations.'
      );
    }

    const { targetUid, tenantId, role, profileId, isTenantAdmin } = request.data;

    // 2. Validate Payload
    if (!targetUid || !tenantId || !role || !profileId || typeof isTenantAdmin !== 'boolean') {
      throw new HttpsError(
        'invalid-argument',
        'Missing required parameters: targetUid, tenantId, role, profileId, isTenantAdmin.'
      );
    }

    const callerToken = request.auth.token;
    const callerTenantId = callerToken.tenantId;
    const isCallerTenantAdmin = callerToken.isTenantAdmin === true;
    const isCallerGlobalAdmin = callerToken.role === 'admin' || callerToken.admin === true;

    // Check if caller is authorized: global admin or tenant admin of the matching tenantId
    const isAuthorized = isCallerGlobalAdmin || (callerTenantId === tenantId && isCallerTenantAdmin);

    if (!isAuthorized) {
      // Optional check for initial bootstrap: If no users exist yet in this tenant's users collection
      const existingTenantUsers = await db.collection(`tenants/${tenantId}/users`).limit(1).get();
      const isBootstrapScenario = existingTenantUsers.empty && request.auth.uid === targetUid;

      if (!isBootstrapScenario) {
        throw new HttpsError(
          'permission-denied',
          'Access denied: You must be an administrator of this tenant to assign custom claims.'
        );
      }
    }

    try {
      // 3. Define Custom Claims
      const customClaims = {
        tenantId,
        role,
        profileId,
        isTenantAdmin,
      };

      // 4. Set Custom User Claims in Firebase Auth
      await admin.auth().setCustomUserClaims(targetUid, customClaims);

      // 5. Fetch target user record from Auth for profile sync
      const targetUser = await admin.auth().getUser(targetUid);

      // 6. Synchronize User Document in Firestore under tenants/{tenantId}/users/{targetUid}
      const tenantUserRef = db.doc(`tenants/${tenantId}/users/${targetUid}`);
      await tenantUserRef.set(
        {
          uid: targetUid,
          email: targetUser.email || '',
          displayName: targetUser.displayName || '',
          photoURL: targetUser.photoURL || null,
          tenantId,
          role,
          profileId,
          isTenantAdmin,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      // Also sync top-level user doc for backwards compatibility
      const globalUserRef = db.doc(`users/${targetUid}`);
      await globalUserRef.set(
        {
          tenantId,
          role,
          profileId,
          isTenantAdmin,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(
        `[setUserCustomClaims] Successfully updated claims for user ${targetUid} in tenant ${tenantId} by caller ${request.auth.uid}`
      );

      return {
        success: true,
        message: `Custom claims and profile synchronized for user ${targetUid}`,
        claims: customClaims,
      };
    } catch (error: any) {
      console.error(`[setUserCustomClaims Error] Failed to update claims for ${targetUid}:`, error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError('internal', error.message || 'Failed to update custom claims.');
    }
  }
);
