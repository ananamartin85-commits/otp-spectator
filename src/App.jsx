import React, { useState, useEffect } from 'react';

// Colores para cada liga de LoL
const tierColors = {
  IRON: "text-gray-500",
  BRONZE: "text-amber-700",
  SILVER: "text-slate-400",
  GOLD: "text-yellow-400",
  PLATINUM: "text-teal-400",
  EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400",
  MASTER: "text-purple-400",
  GRANDMASTER: "text-red-500",
  CHALLENGER: "text-amber-300",
  UNRANKED: "text-slate-600"
};

const LiveParticipant = ({ part, patchVersion }) => (
  <div className={`flex items-center gap-3 p-2 rounded-xl border ${part.isTarget ? 'bg-[#ffb800]/10 border-[#ffb800]/30' : 'bg-white/5 border-transparent'}`}>
    <img 
      src={`https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${part.championName}.png`}
      alt={part.championName}
      className="w-9 h-9 rounded-full border border-[#2a3655] bg-[#0d1016]"
      onError={(e) => { e.target.src = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png"; }}
    />
    
    <div className="flex flex-col min-w-0 flex-1">
      <div className="flex items-baseline gap-1 truncate">
        <span className={`text-sm font-bold truncate uppercase tracking-tight ${part.isTarget ? 'text-[#ffb800]' : 'text-slate-200'}`}>
          {part.summonerName}
        </span>
        <span className="text-[9px] font-bold text-[#c8aa6e] opacity-60 uppercase">
          #{part.summonerTag}
        </span>
      </div>
      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-medium">{part.championName}</span>
    </div>

    {/* SECCIÓN DE RANK Y WINRATE OP.GG */}
    {part.rank && (
      <div className="flex flex-col items-end text-right ml-2 flex-shrink-0">
          <span className={`text-[10px] font-black uppercase tracking-wider ${tierColors[part.rank.tier] || 'text-slate-500'}`}>
              {part.rank.tier} {part.rank.rank}
          </span>
          {part.rank.tier !== 'UNRANKED' ? (
              <span className={`text-[9px] font-bold ${part.rank.wr >= 55 ? 'text-emerald-400' : part.rank.wr < 48 ? 'text-red-400' : 'text-slate-400'}`}>
                  {part.rank.wr}% WR <span className="opacity-40 font-medium">({part.rank.total}G)</span>
              </span>
          ) : (
              <span className="text-[9px] text-slate-600 font-medium tracking-widest">---</span>
          )}
      </div>
    )}
  </div>
);

export default function App() {
  const [otpList, setOtpList] = useState([]);
  const [data, setData] = useState({});
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [patchVersion, setPatchVersion] = useState("14.7.1");

  useEffect(() => {
    fetch("https://ddragon.leagueoflegends.com/api/versions.json")
      .then(res => res.json())
      .then(versions => {
        if (versions && versions.length > 0) {
          setPatchVersion(versions[0]);
        }
      })
      .catch(e => console.error("Error buscando parche", e));
  }, []);

  useEffect(() => {
    fetch("https://otp-spectator-backend.onrender.com/api/init-targets")
      .then(res => res.json())
      .then(setOtpList)
      .catch(e => console.error("Error cargando objetivos", e));
  }, []);

  const fetchData = async () => {
    if (otpList.length === 0) return;
    
    for (let otp of otpList) {
      try {
        const res = await fetch(`https://otp-spectator-backend.onrender.com/api/check/${otp.puuid}`);
        
        if (!res.ok) {
          await new Promise(r => setTimeout(r, 2000));
          continue; 
        }

        const result = await res.json();
        
        setData(prev => ({
          ...prev,
          [otp.name]: result
        }));
        
        await new Promise(r => setTimeout(r, 1000));
      } catch (e) { 
        console.error(e); 
      }
    }
  };

  useEffect(() => {
    if (otpList.length > 0) {
      fetchData();
      const interval = setInterval(fetchData, 120000);
      return () => clearInterval(interval);
    }
  }, [otpList]);

  return (
    <div className="min-h-screen p-6 md:p-10 selection:bg-[#ffb800] selection:text-black">
      
      <header className="max-w-7xl mx-auto mb-16 flex flex-col items-center border-b border-[#1e2328] pb-10">
          <h1 className="text-5xl font-extrabold tracking-tighter text-white italic flex items-center justify-center gap-2">
            SPECTATE <span className="text-cyan-400">TOOL</span>
          </h1>
          <p className="text-[#c8aa6e] text-xs font-bold tracking-[0.5em] uppercase mt-2 opacity-80">Educational Dashboard v2.5</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
        {otpList.map((otp) => {
          const info = data[otp.name];
          const isPlaying = info?.status === 'IN_GAME';
          const isQueue = info?.status === 'OFFLINE' && info?.last_game_ago < 10;
          
          let displayChamp = otp.defaultChamp;
          if (isPlaying && info.participants) {
            const target = info.participants.find(p => p.isTarget);
            if (target) displayChamp = target.championName;
          }

          return (
            <div 
              key={otp.puuid} 
              onClick={() => isPlaying ? setSelectedPlayer(otp.name) : null}
              className={`aspect-[10/11] bg-[#0d1016] rounded-3xl p-6 flex flex-col items-center justify-center transition-all duration-300 relative group overflow-hidden border-gradient hover:-translate-y-1 ${
                isPlaying 
                  ? 'inner-glow-gold cursor-pointer hover:bg-[#11161d]' 
                  : isQueue
                  ? 'border border-red-600 shadow-[0_0_25px_rgba(239,68,68,0.2)] animate-pulse'
                  : 'hover:border-slate-600'
              }`}
            >
              <img 
                src={`https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${displayChamp}_0.jpg`}
                className="absolute inset-0 w-full h-full object-cover opacity-[0.015] grayscale pointer-events-none group-hover:opacity-10 transition-opacity"
                alt=""
                onError={(e) => { e.target.style.display = 'none'; }}
              />

              <div className={`relative w-20 h-20 rounded-full flex items-center justify-center mb-5 flex-shrink-0 ${
                  isPlaying ? 'shadow-[0_0_30px_rgba(200,170,110,0.5)]' : 
                  isQueue ? 'shadow-[0_0_30px_rgba(239,68,68,0.5)]' : 
                  'grayscale opacity-50 group-hover:opacity-100 group-hover:grayscale-0'
              } transition-all duration-500`}>
                  
                  <div className={`absolute -inset-1.5 rounded-full border-2 ${
                      isPlaying ? 'border-[#c8aa6e]' : 
                      isQueue ? 'border-red-500' : 'border-[#1e2328]'
                  } opacity-30`}></div>
                  
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${displayChamp}.png`}
                    className="w-full h-full rounded-full object-cover border-4 border-black bg-[#0d1016]"
                    alt="Champ"
                    onError={(e) => { e.target.src = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png"; }}
                  />
              </div>

              <div className="text-center z-10 w-full">
                <h2 className={`text-base font-black uppercase tracking-wider truncate text-white leading-tight`}>
                  {otp.name}
                </h2>
                <span className="text-[10px] text-[#c8aa6e] font-bold uppercase tracking-[0.2em] opacity-50 mb-3 block">#{otp.tag}</span>
                
                {isPlaying ? (
                    <div className="bg-[#c8aa6e]/10 text-[#c8aa6e] text-[9px] font-black px-3 py-1 rounded uppercase tracking-wider inline-flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-[#c8aa6e] rounded-full animate-pulse"></div> IN GAME
                    </div>
                  ) : isQueue ? (
                    <div className="bg-red-500/10 text-red-400 text-[9px] font-black px-3 py-1 rounded uppercase tracking-wider inline-flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div> TARGET READY
                    </div>
                  ) : (
                    <div className="text-slate-600 text-[9px] font-black px-3 py-1 uppercase tracking-wider inline-flex items-center gap-1.5">
                      IDLE
                    </div>
                  )
                }
                
                <p className="text-[10px] text-slate-500 mt-2 font-medium">
                  {isPlaying ? `${info.time}m elapsed` : info?.last_game_ago ? `${info.last_game_ago}m ago` : 'scanning'}
                </p>
              </div>
            </div>
          );
        })}
      </main>

      {selectedPlayer && data[selectedPlayer] && data[selectedPlayer].status === 'IN_GAME' && (
        <div 
          className="fixed inset-0 bg-[#030408]/90 backdrop-blur-xl flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="bg-[#0d1016] border border-[#1e2328] inner-glow-cyan rounded-3xl p-8 md:p-10 w-full max-w-4xl shadow-2xl relative"
            onClick={e => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-8 right-8 text-slate-500 hover:text-cyan-400 text-xl transition-colors"
            >
              ✕
            </button>

            <div className="mb-10 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-500 mb-4 flex-shrink-0">
                  <img 
                    src={`https://ddragon.leagueoflegends.com/cdn/${patchVersion}/img/champion/${data[selectedPlayer].participants.find(p => p.isTarget)?.championName}.png`} 
                    className="w-full h-full bg-[#0d1016]"
                    onError={(e) => { e.target.src = "https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-icons/-1.png"; }}
                  />
              </div>
              <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
                {selectedPlayer} <span className="text-cyan-400">MATCH</span>
              </h3>
              <p className="text-slate-400 text-xs font-bold mt-1 tracking-widest uppercase">
                {data[selectedPlayer].queueType} • {data[selectedPlayer].time} MINUTES
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
              <div className="space-y-2">
                <div className="border-b border-[#1e2328] pb-3 mb-5">
                  <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Blue Team
                  </p>
                </div>
                {data[selectedPlayer].participants.filter(p => p.teamId === 100).map((p, i) => (
                  <LiveParticipant key={i} part={p} patchVersion={patchVersion} />
                ))}
              </div>

              <div className="space-y-2">
                <div className="border-b border-[#1e2328] pb-3 mb-5 text-right flex flex-col">
                  <p className="text-xs font-black text-red-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2 justify-end self-end">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Red Team
                  </p>
                </div>
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
