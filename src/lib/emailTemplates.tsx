const BASE = {
  accent: "#468189",
  accentHover: "#355f66",
  lightBg: "#eef0f2",
  lightCard: "#e2e6ea",
  lightBorder: "#cdd3dc",
  lightBodyText: "#212227",
  lightSecondaryText: "#637074",
  lightHeader: "#0a1628",
  lightNav: "#031926",
  btnText: "#ffffff",
};

function shell(title: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title}</title>
  <meta name="color-scheme" content="light only"/>
  <meta name="supported-color-schemes" content="light"/>
  <style>:root { color-scheme: light only; }</style>
</head>
<body style="margin:0;padding:0;background:${BASE.lightBg};font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${BASE.lightBg};padding:40px 0;">
    <tr>
      <td align="center">
        <table width="480" cellpadding="0" cellspacing="0"
          style="background:${BASE.lightCard};border-radius:12px;overflow:hidden;border:1px solid ${BASE.lightBorder};">

          <!-- Header -->
          <tr>
            <td style="background:#031926;padding:24px 40px;text-align:center;">
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>

                  <!-- Icon -->
                  <td style="vertical-align:middle;padding-right:12px;">
                    <table cellpadding="0" cellspacing="0" style="width:48px;height:48px;background:#2a7f8a;border-radius:9px;">
                      <tr><td style="padding:2px;">
                        <table cellpadding="0" cellspacing="0" style="width:44px;height:44px;background:#0f1e30;border-radius:7px;">
                          <tr><td style="padding:3px 2px 0 2px;">
                            <table cellpadding="0" cellspacing="0" style="width:40px;height:35px;background:#e8e0d0;border-radius:8px;">
                              <tr><td style="padding:4px 3px 0 3px;">
                                <table cellpadding="0" cellspacing="0" style="width:34px;height:24px;background:#0f1e30;border-radius:5px;">
                                  <tr><td style="padding:5px 4px;">
                                    <table cellpadding="0" cellspacing="0">
                                      <tr>
                                        <td style="width:11px;height:8px;background:#3a9aa8;border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
                                        <td style="width:6px;">&nbsp;</td>
                                        <td style="width:11px;height:8px;background:#3a9aa8;border-radius:2px;font-size:0;line-height:0;">&nbsp;</td>
                                      </tr>
                                    </table>
                                  </td></tr>
                                </table>
                              </td></tr>
                            </table>
                          </td></tr>
                        </table>
                      </td></tr>
                    </table>
                  </td>

                  <!-- Wordmark -->
                  <td style="vertical-align:middle;">
                    <span style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#ffffff;">Watched</span><span style="font-family:'Inter','Helvetica Neue',Arial,sans-serif;font-size:28px;font-weight:700;letter-spacing:-0.5px;color:#468189;">This</span>
                  </td>

                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              ${body}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:18px 40px;border-top:1px solid ${BASE.lightBorder};text-align:center;">
              <p style="margin:0;color:${BASE.lightSecondaryText};font-size:12px;">
                © ${new Date().getFullYear()} WatchedThis. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function getPasswordResetTemplate(resetLink: string): string {
  const body = `
    <h2 style="margin:0 0 10px;font-size:19px;color:${BASE.lightHeader};font-weight:700;">
      Reset your password
    </h2>
    <p style="margin:0 0 26px;color:${BASE.lightSecondaryText};font-size:14px;line-height:1.65;">
      We received a request to reset the password on your account.
      Click the button below to choose a new one.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:26px;">
          <a href="${resetLink}"
            style="display:inline-block;background:${BASE.accent};color:${BASE.btnText};
                   text-decoration:none;padding:12px 30px;border-radius:8px;
                   font-size:14px;font-weight:600;">
            Reset Password
          </a>
        </td>
      </tr>
    </table>

    <div style="background:${BASE.lightBg};border-radius:8px;padding:14px 16px;
                border-left:3px solid ${BASE.accent};">
      <p style="margin:0;color:${BASE.lightSecondaryText};font-size:12px;line-height:1.6;">
        This link expires in <strong style="color:${BASE.lightBodyText};">1 hour</strong>.
        If you didn't request a password reset, you can safely ignore this email —
        your password won't change.
      </p>
    </div>
  `;
  return shell("Reset your password", body);
}

export function getEmailVerificationTemplate(verifyLink: string): string {
  const body = `
    <h2 style="margin:0 0 10px;font-size:19px;color:${BASE.lightHeader};font-weight:700;">
      Verify your email address
    </h2>
    <p style="margin:0 0 26px;color:${BASE.lightSecondaryText};font-size:14px;line-height:1.65;">
      Thanks for signing up! Click the button below to verify your email address
      and activate your account.
    </p>

    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding-bottom:26px;">
          <a href="${verifyLink}"
            style="display:inline-block;background:${BASE.accent};color:${BASE.btnText};
                   text-decoration:none;padding:12px 30px;border-radius:8px;
                   font-size:14px;font-weight:600;">
            Verify Email
          </a>
        </td>
      </tr>
    </table>

    <div style="background:${BASE.lightBg};border-radius:8px;padding:14px 16px;
                border-left:3px solid ${BASE.accent};">
      <p style="margin:0;color:${BASE.lightSecondaryText};font-size:12px;line-height:1.6;">
        This link expires in <strong style="color:${BASE.lightBodyText};">24 hours</strong>.
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  `;
  return shell("Verify your email address", body);
}