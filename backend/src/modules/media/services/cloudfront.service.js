const crypto = require('crypto');

/**
 * Generate a pre-signed CloudFront URL for accessing HLS streams or private assets
 * @param {string} url - The CloudFront URL to sign (e.g. https://cdn.platform.com/uploads/video/master.m3u8)
 * @param {Date|number} expiresAt - Expiration timestamp or date
 * @returns {string} Signed CloudFront URL
 */
const generateSignedUrl = (url, expiresAt) => {
  const keyPairId = process.env.CF_KEY_PAIR_ID;
  const privateKey = process.env.CF_PRIVATE_KEY;

  if (!keyPairId || !privateKey || privateKey === 'dummy') {
    // Fallback for local development
    const mockExpiry = Math.floor(new Date(expiresAt).getTime() / 1000);
    return `${url}?Policy=mock-policy&Signature=mock-sig-${mockExpiry}&Key-Pair-Id=mock-key-pair`;
  }

  try {
    const epochTime = Math.floor(new Date(expiresAt).getTime() / 1000);
    const policy = JSON.stringify({
      Statement: [
        {
          Resource: url,
          Condition: {
            DateLessThan: {
              "AWS:EpochTime": epochTime
            }
          }
        }
      ]
    });

    const sign = crypto.createSign('SHA1');
    sign.update(policy);
    
    // Format signature to be URL safe
    const signature = sign.sign(privateKey, 'base64')
      .replace(/\+/g, '-')
      .replace(/\=/g, '_')
      .replace(/\//g, '~');

    const safePolicy = Buffer.from(policy)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\=/g, '_')
      .replace(/\//g, '~');

    return `${url}?Policy=${safePolicy}&Signature=${signature}&Key-Pair-Id=${keyPairId}`;
  } catch (err) {
    // Graceful fallback to prevent runtime crash in dev environments
    const mockExpiry = Math.floor(new Date(expiresAt).getTime() / 1000);
    return `${url}?Policy=err-policy&Signature=err-sig-${mockExpiry}&Key-Pair-Id=${keyPairId || 'unknown'}`;
  }
};

module.exports = {
  generateSignedUrl
};
