import { getCopyByPage } from '@/lib/app/content/copy-system';
import { Navbar as NavbarComponent } from '@/components/app/navigation/Navbar';
import { Footer as FooterComponent } from '@/components/app/layout/Footer';

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


