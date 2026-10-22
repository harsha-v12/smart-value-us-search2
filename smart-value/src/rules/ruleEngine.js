/**
 * Advanced Targeting Rule Engine
 * Evaluates traffic parameters according to configured deny/allow rules.
 */

const UNRESOLVED_CAMPAIGN_MACROS = [
  '%7b%7bcampaign.id%7d%7d',
  '{campaign.id}',
  '{{campaing.id}}',
  '{{campaign.id}}',
  '{campaign_id}',
  '{{campaign_id}}',
  '%7b%7bcampaign_id%7d%7d',
  '{sub7}',
  '{{sub7}}',
  '%7b%7bsub7%7d%7d',
];

const defaultPrefixes = ['us-hs-bv', 'us-tik-hi-rv'];
const envPrefixes = (process.env.REQUIRED_PREFIX || '')
  .split(',')
  .map(p => p.trim().toLowerCase())
  .filter(Boolean);

const REQUIRED_PREFIXES = Array.from(new Set([...defaultPrefixes, ...envPrefixes]));

/**
 * Checks if a string starts with any of the allowed prefixes (e.g. US-hs-Bv, US-TIK-HI-RV).
 */
function hasValidPrefix(str) {
  if (!str || typeof str !== 'string') return false;
  const lower = str.trim().toLowerCase();
  return REQUIRED_PREFIXES.some(prefix => lower.startsWith(prefix));
}

/**
 * Validates a click ID parameter (fbclid or ttclid).
 * Must be present and non-empty.
 * 
 * @param {string|null|undefined} clickId 
 * @param {string} paramName - Name of parameter for error reporting ('fbclid' | 'ttclid')
 * @returns {{ isDenied: boolean, reason: string | null }}
 */
function evaluateClickIdRule(clickId, paramName = 'fbclid') {
  if (!clickId || typeof clickId !== 'string' || clickId.trim() === '') {
    return {
      isDenied: true,
      reason: `${paramName}_empty`,
    };
  }

  const trimmed = clickId.trim();
  if (trimmed.startsWith('{') || UNRESOLVED_CAMPAIGN_MACROS.includes(trimmed.toLowerCase())) {
    return {
      isDenied: true,
      reason: `${paramName}_unresolved_macro`,
    };
  }

  return { isDenied: false, reason: null };
}

/**
 * Validates fbclid parameter.
 * @param {string|null|undefined} fbclid 
 * @returns {{ isDenied: boolean, reason: string | null }}
 */
function evaluateFbclidRule(fbclid) {
  return evaluateClickIdRule(fbclid, 'fbclid');
}

/**
 * Validates ttclid parameter for TikTok traffic.
 * @param {string|null|undefined} ttclid 
 * @returns {{ isDenied: boolean, reason: string | null }}
 */
function evaluateTtclidRule(ttclid) {
  return evaluateClickIdRule(ttclid, 'ttclid');
}

/**
 * Evaluates P2 parameter.
 * Rule 'p2 - targeting-allow': ALLOW only if STARTS_WITH 'HI-Lead-Rvs'
 * 
 * @param {string|null|undefined} p2 - The p2 parameter value
 * @returns {{ isDenied: boolean, reason: string | null }} Rule evaluation result
 */
function evaluateP2Rule(p2) {
  if (!p2 || typeof p2 !== 'string' || p2.trim() === '') {
    return {
      isDenied: true,
      reason: 'p2_empty',
    };
  }

  const trimmedP2 = p2.trim();

  // Deny unresolved template macros or braces
  if (trimmedP2.startsWith('{') || UNRESOLVED_CAMPAIGN_MACROS.includes(trimmedP2.toLowerCase())) {
    return {
      isDenied: true,
      reason: 'p2_unresolved_macro',
    };
  }

  // Must START WITH allowed prefix (US-hs-Bv for SmartValue, HI-Lead-Rvs for SecureSavings)
  if (!hasValidPrefix(trimmedP2)) {
    return {
      isDenied: true,
      reason: 'p2_prefix_mismatch',
    };
  }

  return {
    isDenied: false,
    reason: null,
  };
}

/**
 * Evaluates SUB7 parameter.
 * Rule: ALLOW only if STARTS_WITH 'US-hs-Bv' (or 'HI-Lead-Rvs')
 * 
 * @param {string|null|undefined} sub7 - The sub7 / SUB7 parameter value
 * @returns {{ isDenied: boolean, reason: string | null }} Rule evaluation result
 */
function evaluateSub7Rule(sub7) {
  if (!sub7 || typeof sub7 !== 'string' || sub7.trim() === '') {
    return {
      isDenied: true,
      reason: 'sub7_empty',
    };
  }

  const trimmedSub7 = sub7.trim();

  // Deny unresolved template macros or braces
  if (trimmedSub7.startsWith('{') || UNRESOLVED_CAMPAIGN_MACROS.includes(trimmedSub7.toLowerCase())) {
    return {
      isDenied: true,
      reason: 'sub7_unresolved_macro',
    };
  }

  // Must START WITH allowed prefix (US-hs-Bv for SmartValue, HI-Lead-Rvs for SecureSavings)
  if (!hasValidPrefix(trimmedSub7)) {
    return {
      isDenied: true,
      reason: 'sub7_prefix_mismatch',
    };
  }

  return {
    isDenied: false,
    reason: null,
  };
}

/**
 * Validates request tracking parameters.
 * ALL 3 CONDITIONS MUST BE SATISFIED TO ALLOW:
 * 1. fbclid must be present & valid.
 * 2. p2 must start with 'HI-Lead-Rvs'.
 * 3. sub7 must start with 'HI-Lead-Rvs'.
 * 
 * @param {Object} query - Incoming query parameters
 * @returns {{ isValid: boolean, isDenied: boolean, denyReason: string | null }}
 */
function validateTrackingParams(query = {}) {
  const fbclid = query.fbclid;
  const ttclid = query.ttclid;
  const p2 = query.p2 || query.P2;
  const sub7 = query.sub7 || query.SUB7 || query.p7 || query.P7;

  // Condition 1: Click ID check (fbclid or ttclid)
  let clickIdEval;
  if (ttclid !== undefined && fbclid === undefined) {
    clickIdEval = evaluateTtclidRule(ttclid);
  } else {
    clickIdEval = evaluateFbclidRule(fbclid);
  }

  if (clickIdEval.isDenied) {
    return {
      isValid: false,
      isDenied: true,
      denyReason: clickIdEval.reason,
    };
  }

  // Condition 2: p2 starts with allowed prefix (US-hs-Bv or US-TIK-HI-RV)
  const p2Eval = evaluateP2Rule(p2);
  if (p2Eval.isDenied) {
    return {
      isValid: false,
      isDenied: true,
      denyReason: p2Eval.reason,
    };
  }

  // Condition 3: sub7 starts with allowed prefix (US-hs-Bv or US-TIK-HI-RV)
  const sub7Eval = evaluateSub7Rule(sub7);
  if (sub7Eval.isDenied) {
    return {
      isValid: false,
      isDenied: true,
      denyReason: sub7Eval.reason,
    };
  }

  // Condition 4: Mandatory channel flag validation (TikTok requires tk=1, Facebook requires fb=1)
  const isTikTok = (ttclid !== undefined && ttclid !== '') ||
    (typeof p2 === 'string' && p2.trim().toLowerCase().startsWith('us-tik-hi-rv')) ||
    (typeof sub7 === 'string' && sub7.trim().toLowerCase().startsWith('us-tik-hi-rv'));

  if (isTikTok) {
    const isTkOne = query.tk !== undefined && query.tk.toString().trim() === '1';
    if (!isTkOne) {
      return {
        isValid: false,
        isDenied: true,
        denyReason: 'tiktok_missing_tk',
      };
    }
  } else {
    const isFbOne = query.fb !== undefined && query.fb.toString().trim() === '1';
    if (!isFbOne) {
      return {
        isValid: false,
        isDenied: true,
        denyReason: 'facebook_missing_fb',
      };
    }
  }

  // All conditions satisfied!
  return {
    isValid: true,
    isDenied: false,
    denyReason: null,
  };
}

module.exports = {
  REQUIRED_PREFIXES,
  REQUIRED_PREFIX: REQUIRED_PREFIXES[0],
  hasValidPrefix,
  evaluateClickIdRule,
  evaluateFbclidRule,
  evaluateTtclidRule,
  evaluateP2Rule,
  evaluateSub7Rule,
  validateTrackingParams,
  UNRESOLVED_CAMPAIGN_MACROS,
};
