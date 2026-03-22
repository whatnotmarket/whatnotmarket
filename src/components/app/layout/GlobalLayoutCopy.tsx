import { Footer as FooterComponent } from '@/components/app/layout/Footer';
import { Navbar as NavbarComponent } from '@/components/app/navigation/Navbar';
import { getCopyByPage } from '@/lib/app/content/copy-system';

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


