/**
 * Cagey -- Apps-in-Toss Integrated Ad SDK Wrapper
 *
 * Uses loadFullScreenAd / showFullScreenAd from @apps-in-toss/framework.
 * Interstitial and rewarded ads share the same API; the ad type is
 * determined automatically by the adGroupId configured in the console.
 *
 * Test IDs are used as defaults until real IDs are configured.
 */

import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/framework';

// ---- Test ad group IDs (replace with real IDs from the console) ----
const INTERSTITIAL_AD_GROUP_ID = 'ait-ad-test-interstitial-id';
const REWARDED_AD_GROUP_ID = 'ait-ad-test-rewarded-id';

/**
 * Whether the current environment supports fullscreen ads.
 */
export function isAdSupported(): boolean {
  try {
    return loadFullScreenAd.isSupported() && showFullScreenAd.isSupported();
  } catch {
    return false;
  }
}

/**
 * Pre-load an interstitial ad so it's ready to show immediately.
 * Resolves when the ad is loaded; rejects on error.
 */
export function loadInterstitialAd(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!isAdSupported()) {
      resolve(); // graceful no-op
      return;
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('[ads] interstitial load timed out after 15s'));
      }
    }, 15000);

    loadFullScreenAd({
      options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded' && !settled) {
          settled = true;
          clearTimeout(timeout);
          resolve();
        }
      },
      onError: (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          console.warn('[ads] interstitial load failed:', err);
          reject(err);
        }
      },
    });
  });
}

/**
 * Show a previously-loaded interstitial ad.
 * Returns `true` if the ad was shown and dismissed, `false` otherwise.
 */
export function showInterstitialAd(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!isAdSupported()) {
      resolve(false);
      return;
    }

    showFullScreenAd({
      options: { adGroupId: INTERSTITIAL_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'dismissed') {
          resolve(true);
        } else if (event.type === 'failedToShow') {
          resolve(false);
        }
      },
      onError: (err) => {
        console.warn('[ads] interstitial show failed:', err);
        resolve(false);
      },
    });
  });
}

/**
 * Pre-load a rewarded ad.
 */
export function loadRewardedAd(): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (!isAdSupported()) {
      resolve();
      return;
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('[ads] rewarded load timed out after 15s'));
      }
    }, 15000);

    loadFullScreenAd({
      options: { adGroupId: REWARDED_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'loaded' && !settled) {
          settled = true;
          clearTimeout(timeout);
          resolve();
        }
      },
      onError: (err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timeout);
          console.warn('[ads] rewarded load failed:', err);
          reject(err);
        }
      },
    });
  });
}

/**
 * Show a previously-loaded rewarded ad.
 * Returns `true` if the user earned the reward, `false` otherwise.
 */
export function showRewardedAd(): Promise<boolean> {
  return new Promise<boolean>((resolve) => {
    if (!isAdSupported()) {
      resolve(false);
      return;
    }

    let rewardEarned = false;

    showFullScreenAd({
      options: { adGroupId: REWARDED_AD_GROUP_ID },
      onEvent: (event) => {
        if (event.type === 'userEarnedReward') {
          rewardEarned = true;
        } else if (event.type === 'dismissed') {
          resolve(rewardEarned);
        } else if (event.type === 'failedToShow') {
          resolve(false);
        }
      },
      onError: (err) => {
        console.warn('[ads] rewarded show failed:', err);
        resolve(false);
      },
    });
  });
}
