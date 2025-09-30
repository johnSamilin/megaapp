import { useEffect, useRef } from 'react';
import rough from 'roughjs';
import { Home, MessageSquare, Calendar, Settings, ShoppingBag, Music, Camera, Users } from 'lucide-react';

interface MiniApp {
  id: string;
  name: string;
  icon: React.ComponentType<{ size?: number }>;
  eventCount?: number;
}

const miniApps: MiniApp[] = [
  { id: 'home', name: 'Home', icon: Home },
  { id: 'messages', name: 'Messages', icon: MessageSquare, eventCount: 3 },
  { id: 'calendar', name: 'Calendar', icon: Calendar, eventCount: 5 },
  { id: 'shop', name: 'Shop', icon: ShoppingBag },
  { id: 'music', name: 'Music', icon: Music, eventCount: 12 },
  { id: 'photos', name: 'Photos', icon: Camera },
  { id: 'social', name: 'Social', icon: Users, eventCount: 7 },
  { id: 'settings', name: 'Settings', icon: Settings },
];

export default function PunkNav() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rc = rough.canvas(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    rc.rectangle(0, 0, width, height, {
      fill: '#fdfcf8',
      fillStyle: 'solid',
      stroke: '#2a2a2a',
      strokeWidth: 3,
      roughness: 2.5,
    });

    rc.line(0, 60, width, 60, {
      stroke: '#2a2a2a',
      strokeWidth: 2,
      roughness: 2,
    });

    const items = document.querySelectorAll('.nav-item');
    items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const navRect = canvas.getBoundingClientRect();
      const y = rect.top - navRect.top;

      if (index > 0) {
        rc.line(10, y - 8, width - 10, y - 8, {
          stroke: '#e0e0e0',
          strokeWidth: 1,
          roughness: 1.5,
        });
      }
    });
  }, []);

  return (
    <nav className="relative w-20 h-screen bg-[#fdfcf8]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      <div className="relative z-10 flex flex-col h-full">
        <div className="h-16 flex items-center justify-center border-b-0">
          <div className="relative">
            <div className="w-10 h-10 bg-[#fff3cd] transform rotate-2 flex items-center justify-center font-black text-xl text-[#2a2a2a] border-2 border-[#2a2a2a]">
              S
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#ff6b9d] border border-[#2a2a2a] transform rotate-12"></div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {miniApps.map((app) => (
            <button
              key={app.id}
              className="nav-item w-full py-4 px-2 flex flex-col items-center gap-1 hover:bg-[#fff9e6] transition-colors relative group"
            >
              <div className="relative">
                <div className="p-2 bg-white border-2 border-[#2a2a2a] transform group-hover:rotate-3 transition-transform">
                  <app.icon size={20} className="text-[#2a2a2a]" />
                </div>
                {app.eventCount && (
                  <div className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 bg-[#ff6b9d] border-2 border-[#2a2a2a] flex items-center justify-center transform -rotate-12">
                    <span className="text-xs font-bold text-white">
                      {app.eventCount > 99 ? '99+' : app.eventCount}
                    </span>
                  </div>
                )}
              </div>
              <span className="text-[9px] font-bold text-[#2a2a2a] uppercase tracking-wider text-center leading-tight">
                {app.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}