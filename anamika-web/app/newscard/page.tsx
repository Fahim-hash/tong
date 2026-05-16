import AuthGuard from '@/components/AuthGuard';

export default function NewsCardPage() {
  return (
    <AuthGuard>
      <div className="p-8">
        <h1>Welcome to the Protected News Card Generator!</h1>
      </div>
    </AuthGuard>
  );
}
