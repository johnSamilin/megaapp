import PunkNav from './components/PunkNav';

function App() {
  return (
    <div className="min-h-screen bg-[#f5f5f0] flex">
      <PunkNav />
      <main className="flex-1 p-8">
        <div className="max-w-4xl">
          <h1 className="text-4xl font-black text-[#2a2a2a] mb-4 uppercase tracking-tight">
            SuperApp Dashboard
          </h1>
          <p className="text-lg text-[#4a4a4a]">
            Your punky navigation is ready! Click on any miniapp to explore.
          </p>
        </div>
      </main>
    </div>
  );
}

export default App;
