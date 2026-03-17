import { getCopyByPage } from '@/lib/copy-system';
import { Navbar as NavbarComponent } from '@/components/Navbar';
import { Footer as FooterComponent } from '@/components/Footer';

// Server Component Wrapper for Layout
export async function GlobalLayoutCopy({ children }: { children: React.ReactNode }) {
  await getCopyByPage('/layout');
  
  return (
    <>
      <NavbarComponent />
      {children}
      <FooterComponent />
    </>
  );
}
