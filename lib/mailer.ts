/**
 * V5000 → Resend 메일 릴레이 (WP wp_mail 실패 시 폴백)
 */

const RESEND_API = 'https://api.resend.com/emails';

function mailFrom(): string {
  return process.env.MAIL_FROM ?? 'Nutrifarmer <onboarding@resend.dev>';
}

function siteName(): string {
  return '탁월한 찬사';
}

export function mailerConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}

export async function sendAccountHintEmail(opts: {
  to: string;
  displayName: string;
  loginId: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const loginUrl = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/login`
    : 'https://nutrifarmer-v5000.vercel.app/login';

  const text = [
    `안녕하세요, ${opts.displayName}님.`,
    '',
    '요청하신 로그인 정보입니다.',
    '',
    `· 이름·별명: ${opts.displayName}`,
    `· 로그인 ID: ${opts.loginId}`,
    `· 이메일: ${opts.to}`,
    '',
    `로그인: ${loginUrl}`,
    `비밀번호 재설정: ${loginUrl}?panel=lost`,
    '',
    `— ${siteName()}`,
  ].join('\r\n');

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: mailFrom(),
      to: opts.to,
      subject: `[${siteName()}] 로그인 정보 안내`,
      text,
    }),
  });

  return res.ok;
}

export async function sendResetCodeEmail(opts: {
  to: string;
  displayName: string;
  code: string;
  verifyUrl: string;
}): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const text = [
    `안녕하세요, ${opts.displayName}님.`,
    '',
    '비밀번호 재설정을 위한 확인 코드입니다.',
    '',
    `확인 코드: ${opts.code}`,
    '',
    '아래 페이지에서 6자리 코드를 입력해 주세요.',
    opts.verifyUrl,
    '',
    '코드는 30분 동안 유효합니다.',
    '',
    `— ${siteName()}`,
  ].join('\r\n');

  const res = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: mailFrom(),
      to: opts.to,
      subject: `[${siteName()}] 비밀번호 재설정 확인 코드`,
      text,
    }),
  });

  return res.ok;
}
