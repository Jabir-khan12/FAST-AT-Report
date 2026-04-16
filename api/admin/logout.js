export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Logout is stateless on the client-side
  // Token is stored in sessionStorage and will be cleared by the frontend
  return res.json({ ok: true });
}
