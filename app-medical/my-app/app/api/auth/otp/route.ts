import { POST as sendOtpPost } from './send/route';

// Backward-compatible alias:
// allows clients to call /api/auth/otp for OTP send flow.
export async function POST(req: Request) {
  return sendOtpPost(req);
}

