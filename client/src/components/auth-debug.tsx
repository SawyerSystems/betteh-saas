import { useUnifiedAuth } from "@/hooks/use-unified-auth";

export function AuthDebugComponent() {
  const auth = useUnifiedAuth();
  
  return (
    <div className="p-4 bg-gray-100 rounded">
      <h3 className="font-bold">Authentication Debug</h3>
      <pre>{JSON.stringify(auth, null, 2)}</pre>
    </div>
  );
}
