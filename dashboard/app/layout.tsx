export const metadata = {
  title: "POS Manager Dashboard",
  description: "Kenya M-Pesa-first POS — manager dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#fafafa" }}>
        {children}
      </body>
    </html>
  );
}
