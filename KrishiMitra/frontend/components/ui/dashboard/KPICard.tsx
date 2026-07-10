type KPICardProps = {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
};

export default function KPICard({
  title,
  value,
  subtitle,
  icon,
}: KPICardProps) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-800/80 backdrop-blur-md p-5 hover:border-green-500 transition-all duration-300">
      
      <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-all" />

      <div className="relative">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-sm">
              {title}
            </p>

            <h2 className="text-4xl font-bold mt-3">
              {value}
            </h2>

            <p className="text-slate-400 mt-2 text-sm">
              {subtitle}
            </p>
          </div>

          <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center text-2xl border border-green-500/20">
            {icon}
          </div>
        </div>

        <div className="mt-5 h-1 rounded-full bg-slate-700 overflow-hidden">
          <div className="h-full w-3/4 bg-green-500 rounded-full" />
        </div>
      </div>
    </div>
  );
}