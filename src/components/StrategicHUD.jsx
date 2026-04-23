import { motion } from 'framer-motion';

export default function StrategicHUD({ nodes = [] }) {
  if (!nodes || nodes.length === 0) {
    // Fallback nodes if none provided
    nodes = [
      { id: '1', label: 'STRATEGIC CORE', value: 100, x: 50, y: 50, connections: [] },
      { id: '2', label: 'MARKET TRENDS', value: 45, x: 20, y: 30, connections: ['1'] },
      { id: '3', label: 'OPERATIONAL ALPHA', value: 82, x: 80, y: 40, connections: ['1'] },
      { id: '4', label: 'RISK MITIGATION', value: 65, x: 50, y: 80, connections: ['1'] }
    ];
  }

  const padding = 10;
  const getViewBox = () => "0 0 100 100";

  return (
    <div className="relative w-full h-full min-h-[250px] md:min-h-[350px] bg-black/40 rounded-3xl overflow-hidden border border-white/5 flex items-center justify-center p-6 group">
      {/* Background Grid */}
      <div className="absolute inset-0 noise-bg" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-500/5 via-transparent to-transparent" />
      
      <svg viewBox={getViewBox()} className="w-full h-full max-w-4xl opacity-80 group-hover:opacity-100 transition-opacity duration-700">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.05)" />
            <stop offset="50%" stopColor="rgba(16, 185, 129, 0.4)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.05)" />
          </linearGradient>
        </defs>

        {/* Tactical Grid Lines */}
        {[...Array(11)].map((_, i) => (
          <line key={`v-${i}`} x1={i * 10} y1="0" x2={i * 10} y2="100" stroke="white" strokeWidth="0.05" strokeOpacity="0.05" />
        ))}
        {[...Array(11)].map((_, i) => (
          <line key={`h-${i}`} x1="0" y1={i * 10} x2="100" y2={i * 10} stroke="white" strokeWidth="0.05" strokeOpacity="0.05" />
        ))}

        {/* Connections */}
        {nodes.map(node => 
          node.connections?.map(targetId => {
            const target = nodes.find(n => n.id === targetId);
            if (!target) return null;
            return (
              <motion.line
                key={`${node.id}-${targetId}`}
                x1={node.x} y1={node.y}
                x2={target.x} y2={target.y}
                stroke="url(#lineGrad)"
                strokeWidth="0.3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.6 }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            );
          })
        )}

        {/* Data Pings */}
        {nodes.map(node => 
          node.connections?.map(targetId => {
            const target = nodes.find(n => n.id === targetId);
            if (!target) return null;
            return (
              <motion.circle
                key={`pulse-${node.id}-${targetId}`}
                r="0.4"
                fill="#fff"
                filter="url(#glow)"
                animate={{
                  cx: [node.x, target.x],
                  cy: [node.y, target.y],
                  opacity: [0, 1, 0]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  delay: Math.random() * 3
                }}
              />
            );
          })
        )}

        {/* Nodes */}
        {nodes.map((node, i) => (
          <motion.g
            key={node.id}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
          >
            {/* Hex Outer */}
            <circle 
              cx={node.x} cy={node.y} r="3" 
              className="fill-black/80 stroke-white/20" 
              strokeWidth="0.2"
            />
            {/* Core Glow */}
            <motion.circle 
              cx={node.x} cy={node.y} r="0.8" 
              className="fill-white" 
              filter="url(#glow)"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ duration: 4, repeat: Infinity, delay: i * 0.2 }}
            />
            
            {/* Context Rings */}
            <circle cx={node.x} cy={node.y} r={node.value / 25} fill="none" stroke="emerald" strokeWidth="0.05" strokeOpacity="0.1" strokeDasharray="1 1" />
            
            {/* Label Block */}
            <g transform={`translate(${node.x}, ${node.y + 6})`}>
              <rect x="-10" y="-1" width="20" height="4" fill="black/60" rx="1" />
              <text 
                className="text-[1.8px] font-display font-bold fill-white/60 uppercase tracking-[0.1em]"
                textAnchor="middle"
                y="1.5"
              >
                {node.label}
              </text>
              <text 
                y="4.5"
                className="text-[2.2px] font-display font-medium fill-emerald-500"
                textAnchor="middle"
              >
                LEVEL: {node.value}%
              </text>
            </g>
          </motion.g>
        ))}
      </svg>

      {/* Foreground Overlays */}
      <div className="absolute bottom-8 left-8 border-l border-emerald-500/30 pl-4">
        <span className="text-[10px] uppercase tracking-[0.4em] text-white/30 mb-1 block">Strategic Network</span>
        <h3 className="text-xl font-display font-medium text-white/90">Multi-Node Synthesis</h3>
      </div>
      
      <div className="absolute top-8 right-8 flex flex-col items-end">
        <div className="text-[8px] uppercase tracking-[0.3em] text-white/40 font-bold mb-1">Status</div>
        <div className="text-[10px] font-display text-emerald-500 flex items-center gap-1.5">
          <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
          ACTIVE_THREAD
        </div>
      </div>
    </div>
  );
}
