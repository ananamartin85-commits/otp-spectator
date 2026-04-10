import React, { useState, useEffect, useCallback } from 'react';

const LiveParticipant = ({ part, patchVersion }) => {
  const champImg = part.championName.replace(/\s|'|\./g, '');
  
  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl border ${part.isTarget ? 'bg-[#ffb800]/10 border-[#ffb800]/30' : 'bg-white/5 border-transparent'}`}>
      <img 
        src={`https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${champImg}.png`}
        alt={part.championName}
        className="w-9 h-9 rounded-full border border-[#2a3655] bg-[#0d1016]"
        onError={(e) => { e.target.src = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png"; }}
      />
      <div className="flex flex-col min-w-0">
        <div className="flex items-baseline gap-1 truncate">
          <span className={`text-sm font-bold truncate uppercase tracking-tight ${part.isTarget ? 'text-[#ffb800]' : 'text-slate-200'}`}>
            {part.summonerName}
          </span>
          <span className="text-[9px] font-bold text-[#c8aa6e] opacity-60 uppercase">
            #{part.summonerTag}
          </span>
        </div>
        
        <div className="text-[10px] text-slate-500 uppercase tracking-wider font-medium flex items-center gap-1.5 truncate">
          <span className="truncate">{part.championName}</span>
          
          {part.proTag && (
            <>
              <span className="text-slate-700 mx-0.5">|</span>
              <span className="text-red-600 font-black">P</span>
              <span className="text-slate-400 font-bold truncate">({part.proTag})</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  const [otpList, setOtpList] = useState([]);
  const [data, setData] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [patchVersion, setPatchVersion] = useState("14.7.1");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then(res => res.json())
      .then(v => v.length > 0 && setPatchVersion(v[0]))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetch("https://otp-spectator-backend.onrender.com/api/init-targets")
      .then(res => res.json())
      .then(list => {
        setOtpList(list);
        setLoading(false);
      })
      .catch(e => {
        console.error("Error al iniciar:", e);
        setLoading(false);
      });
  }, []);

  const fetchData = useCallback(async () => {
    if (otpList.length === 0) return;

    const results = await Promise.all(
      otpList.map(async (otp) => {
        try {
          const res = await fetch(`https://otp-spectator-backend.onrender.com/api/check/${otp.puuid}`);
          const result = res.ok ? await res.json() : null;
          return { name: otp.name, result };
        } catch {
          return { name: otp.name, result: null };
        }
      })
    );

    const nextData = {};
    results.forEach(({ name, result }) => {
      if (result) nextData[name] = result;
    });

    setData(prev => ({ ...prev, ...nextData }));
  }, [otpList]);

  useEffect(() => {
    if (otpList.length > 0) {
      fetchData();
      const interval = setInterval(fetchData, 60000);
      return () => clearInterval(interval);
    }
  }, [otpList, fetchData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030408] flex items-center justify-center">
        <p className="text-[#c8aa6e] font-bold animate-pulse tracking-widest">DESPERTANDO SERVIDOR...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030408] p-6 md:p-10 text-slate-300">
      <header className="max-w-7xl mx-auto mb-12 flex flex-col items-center border-b border-[#1e2328] pb-10">
          <h1 className="text-5xl font-extrabold tracking-tighter text-white italic">
            SPECTATE <span className="text-cyan-400">TOOL</span>
          </h1>
          <p className="text-[#c8aa6e] text-xs font-bold tracking-[0.5em] uppercase mt-2 opacity-80">Live Tracker v2.5</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {otpList.map((otp) => {
          const info = data[otp.name];
          const isPlaying = info?.status === 'IN_GAME';
          const isQueue = info?.status === 'OFFLINE' && info?.last_game_ago < 10;
          
          let displayChamp = otp.defaultChamp;
          if (isPlaying && info.participants) {
            const t = info.participants.find(p => p.isTarget);
            if (t) displayChamp = t.championName;
          }
          const splashName = displayChamp.replace(/\s|'|\./g, '');

          return (
            <div 
              key={otp.puuid} 
              onClick={() => isPlaying && setSelectedPlayer(otp.name)}
              className={`aspect-[10/11] bg-[#0d1016] rounded-3xl p-6 flex flex-col items-center justify-center transition-all duration-300 relative group overflow-hidden border border-[#1e2328] ${
                isPlaying ? 'ring-2 ring-[#c8aa6e]/50 cursor-pointer hover:bg-[#11161d]' : 
                isQueue ? 'border-red-500 animate-pulse' : 'opacity-80 hover:opacity-100'
              }`}
            >
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${splashName}_0.jpg`}
                className="absolute inset-0 w-full h-full object-cover opacity-5 grayscale pointer-events-none group-hover:opacity-15 transition-opacity"
                alt=""
              />

              <div className="relative w-20 h-20 mb-4">
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${splashName}.png`}
                    className={`w-full h-full rounded-full border-2 ${isPlaying ? 'border-[#c8aa6e]' : 'border-slate-700 grayscale'}`}
                    alt="Champ"
                    onError={(e) => { e.target.src = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png"; }}
                  />
              </div>

              <div className="text-center z-10 w-full">
                <h2 className="text-sm font-black text-white truncate uppercase">{otp.name}</h2>
                <span className="text-[10px] text-[#c8aa6e] font-bold block mb-2 opacity-60">#{otp.tag}</span>
                
                {isPlaying ? (
                    <span className="bg-[#c8aa6e]/20 text-[#c8aa6e] text-[9px] font-bold px-2 py-0.5 rounded">IN GAME</span>
                  ) : isQueue ? (
                    <span className="bg-red-500/20 text-red-400 text-[9px] font-bold px-2 py-0.5 rounded">RECENT</span>
                  ) : (
                    <span className="text-slate-600 text-[9px] font-bold">OFFLINE</span>
                  )
                }
                
                <p className="text-[9px] text-slate-500 mt-2">
                  {isPlaying ? `${info.time}m` : info?.last_game_ago ? `${info.last_game_ago}m ago` : '...'}
                </p>
              </div>
            </div>
          );
        })}
      </main>

      {selectedPlayer && data[selectedPlayer]?.status === 'IN_GAME' && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setSelectedPlayer(null)}>
          <div className="bg-[#0d1016] border border-[#1e2328] rounded-3xl p-8 w-full max-w-4xl" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-8">
               <h3 className="text-2xl font-black text-white uppercase italic">{selectedPlayer} <span className="text-cyan-400">Match</span></h3>
               <p className="text-slate-500 text-[10px] tracking-widest">{data[selectedPlayer].queueType} • {data[selectedPlayer].time} MIN</p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-blue-400 uppercase mb-4 tracking-tighter">Blue Team</p>
                {data[selectedPlayer].participants.filter(p => p.teamId === 100).map((p, i) => (
                  <LiveParticipant key={i} part={p} patchVersion={patchVersion} />
                ))}
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-red-500 uppercase mb-4 tracking-tighter text-right">Red Team</p>
                {data[selectedPlayer].participants.filter(p => p.teamId === 200).map((p, i) => (
                  <LiveParticipant key={i} part={p} patchVersion={patchVersion} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
