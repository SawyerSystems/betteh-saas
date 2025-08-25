export default function TestEnv() {
  console.log('All env vars:', import.meta.env);
  console.log('VITE_BANNER_VIDEO_URL:', import.meta.env.VITE_BANNER_VIDEO_URL);
  
  return (
    <div style={{ padding: '20px' }}>
      <h1>Environment Variable Test</h1>
      <p>VITE_BANNER_VIDEO_URL: {import.meta.env.VITE_BANNER_VIDEO_URL || 'NOT FOUND'}</p>
      <p>Type: {typeof import.meta.env.VITE_BANNER_VIDEO_URL}</p>
      <p>All env vars: {JSON.stringify(import.meta.env, null, 2)}</p>
    </div>
  );
}
