import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search01Icon, PlusSignIcon, Delete01Icon, TradeUpIcon } from "hugeicons-react";

export function CardComparator() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [type, setType] = useState<"white" | "black">("white");
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newId, setNewId] = useState("");

  const handleCompare = async () => {
    if (selectedIds.length === 0) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/analytics/cards/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardIds: selectedIds, type }),
      });
      if (res.ok) {
        setResults(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const addId = () => {
    if (newId.trim() && !selectedIds.includes(newId.trim())) {
      setSelectedIds([...selectedIds, newId.trim()]);
      setNewId("");
    }
  };

  const removeId = (id: string) => {
    setSelectedIds(selectedIds.filter((i) => i !== id));
    setResults(results.filter((r) => r.id !== id));
  };

  return (
    <Card className="bg-[#1a1a1a] border-white/5 p-0 overflow-hidden mb-12">
      <CardHeader className="bg-white/5 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <TradeUpIcon size={20} className="text-[#e94560]" />
              Cuadro Comparativo de Cartas
            </CardTitle>
            <CardDescription>Compara métricas directamente por ID de carta.</CardDescription>
          </div>
          <div className="flex bg-black/40 rounded-lg p-1">
            <button 
              className={`px-3 py-1 rounded-md text-sm transition-colors ${type === 'white' ? 'bg-[#e94560] text-white font-medium' : 'text-white/50 hover:text-white'}`}
              onClick={() => { setType("white"); setResults([]); }}
            >
              Blancas
            </button>
            <button 
              className={`px-3 py-1 rounded-md text-sm transition-colors ${type === 'black' ? 'bg-[#e94560] text-white font-medium' : 'text-white/50 hover:text-white'}`}
              onClick={() => { setType("black"); setResults([]); }}
            >
              Negras
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Input Area */}
        <div className="flex gap-2">
          <Input 
            placeholder="Introduce el ID de la carta..." 
            value={newId}
            onChange={(e) => setNewId(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addId()}
            className="bg-black/50 border-white/10 text-white placeholder:text-white/30"
          />
          <Button onClick={addId} variant="secondary" className="bg-white/10 hover:bg-white/20 text-white">
            <PlusSignIcon size={18} className="mr-2" />
            Añadir
          </Button>
        </div>

        {/* Selected IDs Tags */}
        {selectedIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedIds.map(id => (
              <div key={id} className="flex items-center gap-2 bg-black/50 border border-white/10 px-3 py-1.5 rounded-full text-sm">
                <span className="text-white/70 font-mono text-xs">{id}</span>
                <button onClick={() => removeId(id)} className="text-white/40 hover:text-[#e94560] transition-colors">
                  <Delete01Icon size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={handleCompare} 
          disabled={selectedIds.length === 0 || isLoading}
          className="w-full bg-[#e94560] hover:bg-[#d63d56] text-white"
        >
          {isLoading ? "Comparando..." : "Comparar Cartas"}
        </Button>

        {/* Results Table */}
        {results.length > 0 && (
          <div className="border border-white/10 rounded-lg overflow-hidden mt-6">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-white/50 uppercase text-xs">
                <tr>
                  <th className="px-4 py-3 font-medium">Texto</th>
                  <th className="px-4 py-3 font-medium text-right">Jugadas</th>
                  {type === "white" && (
                    <>
                      <th className="px-4 py-3 font-medium text-right">Victorias</th>
                      <th className="px-4 py-3 font-medium text-right">Win Rate</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.id || i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white max-w-[200px] truncate">{r.text}</td>
                    <td className="px-4 py-3 text-right text-white/80 font-medium">{r.timesPlayed}</td>
                    {type === "white" && (
                      <>
                        <td className="px-4 py-3 text-right text-white/80">{r.timesWon}</td>
                        <td className="px-4 py-3 text-right text-green-400 font-medium">
                          {Math.round(r.winRate)}%
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
