export default function AIPanel() {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 h-full">
      <h2 className="text-xl font-bold mb-5">
        AI Assistant
      </h2>

      <div className="space-y-4">
        <div className="flex justify-end">
          <div className="bg-green-600 px-4 py-3 rounded-xl max-w-[80%]">
            How is my farm doing?
          </div>
        </div>

        <div className="flex justify-start">
          <div className="bg-slate-700 px-4 py-3 rounded-xl max-w-[90%]">
            Your soil health is good. Rain is expected
            in 2 days and soybean remains the most
            suitable crop. Light irrigation is
            recommended tomorrow morning.
          </div>
        </div>
      </div>

      <div className="mt-6">
        <input
          placeholder="Ask anything..."
          className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600"
        />
      </div>
    </div>
  );
}