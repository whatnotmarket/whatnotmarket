import { getCopyByPage } from '@/lib/app/content/copy-system';

export const dynamic = 'force-dynamic';

export default async function CopyDemoPage() {
  const copy = await getCopyByPage('/copy-demo');

  return (
    <div className="container mx-auto p-10">
      <h1 className="text-4xl font-bold mb-4">{String(copy['hero_title'] || 'Default Title')}</h1>
      <p className="text-lg mb-8">{String(copy['hero_subtitle'] || 'Default Subtitle')}</p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        {String(copy['cta_button'] || 'Click Me')}
      </button>
      
      <div className="mt-10 p-4 bg-gray-100 rounded text-black">
        <h2 className="font-bold">Debug Data:</h2>
        <pre>{JSON.stringify(copy, null, 2)}</pre>
      </div>
      
      <div className="mt-8 text-sm text-gray-500">
        <p>To populate this page, go to <a href="/copywebsiteadmin" className="underline text-blue-500">/copywebsiteadmin</a> and add items with:</p>
        <ul className="list-disc list-inside mt-2">
          <li>Page: /copy-demo</li>
          <li>Key: hero_title</li>
          <li>Key: hero_subtitle</li>
          <li>Key: cta_button</li>
        </ul>
      </div>
    </div>
  );
}

