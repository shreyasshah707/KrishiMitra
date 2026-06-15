export default function Alerts() {
  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 h-900px">

      <h2 className="text-xl font-bold mb-4">
        ⚠️ Risk Alerts
      </h2>

      <div className="space-y-3">

        <div className="bg-red-800/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 font-semibold">
            Heavy Rain
          </p>
          <p className="text-xs text-slate-400">
            Expected in 48 hours
          </p>
        </div>

        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
          <p className="text-orange-400 font-semibold">
            Drought Risk
          </p>
          <p className="text-xs text-slate-400">
            Medium
          </p>
        </div>

        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-yellow-400 font-semibold">
            Heat Stress
          </p>
          <p className="text-xs text-slate-400">
            Next Week
          </p>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
          <p className="text-green-400 font-semibold">
            Pest Risk
          </p>
          <p className="text-xs text-slate-400">
            Low Probability
          </p>
        </div>

      </div>
    </div>
  );
}