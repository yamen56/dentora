export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container flex min-h-[calc(100vh-4rem)] items-center justify-center py-10">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
