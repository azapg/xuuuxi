import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft01Icon, ChartHistogramIcon, Analytics01Icon, Target01Icon, ChampionIcon } from "hugeicons-react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CardComparator } from "@/components/analytics/CardComparator";

// API endpoints to fetch
const API = {
  overview: "/api/analytics/overview",
  chart: "/api/analytics/charts/card-performance",
  blackRanking: "/api/analytics/cards/black/ranking?limit=10",
  whiteRanking: "/api/analytics/cards/white/ranking?limit=10",
  combos: "/api/analytics/cards/combos?limit=10",
};

export default function Analytics() {
  const [data, setData] = useState<any>({
    overview: null,
    chart: [],
    blackRanking: [],
    whiteRanking: [],
    combos: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [overviewRes, chartRes, blackRes, whiteRes, combosRes] = await Promise.all([
          fetch(API.overview),
          fetch(API.chart),
          fetch(API.blackRanking),
          fetch(API.whiteRanking),
          fetch(API.combos),
        ]);

        if (!overviewRes.ok || !chartRes.ok || !blackRes.ok || !whiteRes.ok || !combosRes.ok) {
          throw new Error("Failed to load analytics data from server.");
        }

        const [overview, chart, blackRanking, whiteRanking, combos] = await Promise.all([
          overviewRes.json(),
          chartRes.json(),
          blackRes.json(),
          whiteRes.json(),
          combosRes.json(),
        ]);

        setData({ overview, chart, blackRanking, whiteRanking, combos });
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-6 h-16 border-b border-white/10 shrink-0 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
        <Button variant="ghost" size="icon" asChild className="mr-4">
          <Link to="/">
            <ArrowLeft01Icon size={24} />
          </Link>
        </Button>
        <h1 className="text-xl font-bold tracking-tight text-[#e94560] flex items-center gap-2">
          <Analytics01Icon size={24} />
          Xuuuxi Analytics
        </h1>
      </header>

      {/* Main Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 max-w-7xl mx-auto w-full space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Estadísticas Generales</h2>
              <p className="text-muted-foreground mt-1 text-white/60">
                Datos globales de todas las partidas jugadas. (Español)
              </p>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
              {error}
            </div>
          )}

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-[#1a1a1a] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Partidas Jugadas</CardTitle>
                <Target01Icon className="h-5 w-5 text-[#e94560]" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {isLoading ? "..." : data.overview?.totalSessions || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Rondas Disputadas</CardTitle>
                <ChampionIcon className="h-5 w-5 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {isLoading ? "..." : data.overview?.totalRounds || 0}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-white/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-white/70">Cartas Jugadas</CardTitle>
                <ChartHistogramIcon className="h-5 w-5 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold">
                  {isLoading ? "..." : data.overview?.totalCardsPlayed || 0}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chart Section */}
          <Card className="bg-[#1a1a1a] border-white/5 p-6">
            <div className="mb-4">
              <h3 className="text-xl font-bold">Rendimiento de Cartas (Jugadas vs Ganadas)</h3>
              <p className="text-sm text-white/50">Top 10 Cartas Blancas Más Jugadas</p>
            </div>
            <div className="h-[300px] w-full">
              {isLoading ? (
                <div className="h-full w-full flex items-center justify-center text-white/30">Cargando gráfico...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.chart} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888" 
                      tick={{ fill: '#888', fontSize: 12 }} 
                      tickFormatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                    />
                    <YAxis stroke="#888" tick={{ fill: '#888' }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="played" name="Jugadas" fill="#8884d8" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="won" name="Ganadas" fill="#e94560" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Tables Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-[#1a1a1a] border-white/5 p-0 overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="text-lg">Top Cartas Negras</CardTitle>
                <CardDescription>Las cartas más usadas como juez.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-white/50 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 font-medium">Carta</th>
                      <th className="px-6 py-3 font-medium text-right">Jugadas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.blackRanking?.length === 0 && !isLoading && (
                      <tr><td colSpan={2} className="px-6 py-8 text-center text-white/30">Sin datos</td></tr>
                    )}
                    {data.blackRanking?.map((card: any, i: number) => (
                      <tr key={card.id || i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 truncate max-w-[200px]">{card.text}</td>
                        <td className="px-6 py-4 text-right font-medium text-[#e94560]">{card.timesPlayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="bg-[#1a1a1a] border-white/5 p-0 overflow-hidden">
              <CardHeader className="bg-white/5 border-b border-white/5">
                <CardTitle className="text-lg">Top Cartas Blancas (Mejor Win Rate)</CardTitle>
                <CardDescription>Las cartas que aseguran victorias.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white/5 text-white/50 uppercase text-xs">
                    <tr>
                      <th className="px-6 py-3 font-medium">Carta</th>
                      <th className="px-6 py-3 font-medium text-right">Win Rate</th>
                      <th className="px-6 py-3 font-medium text-right">Victorias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.whiteRanking?.length === 0 && !isLoading && (
                      <tr><td colSpan={3} className="px-6 py-8 text-center text-white/30">Sin datos</td></tr>
                    )}
                    {data.whiteRanking?.map((card: any, i: number) => (
                      <tr key={card.id || i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 truncate max-w-[200px]">{card.text}</td>
                        <td className="px-6 py-4 text-right font-medium text-green-400">
                          {Math.round(card.winRate * 100)}%
                        </td>
                        <td className="px-6 py-4 text-right text-white/70">{card.timesWon}/{card.timesPlayed}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1a1a1a] border-white/5 p-0 overflow-hidden mb-12">
            <CardHeader className="bg-white/5 border-b border-white/5">
              <CardTitle className="text-lg">Mejores Combinaciones</CardTitle>
              <CardDescription>Duos dinámicos que garantizan risas.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-white/50 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-3 font-medium">Carta Negra</th>
                    <th className="px-6 py-3 font-medium">Carta Blanca</th>
                    <th className="px-6 py-3 font-medium text-right">Victorias</th>
                  </tr>
                </thead>
                <tbody>
                  {data.combos?.length === 0 && !isLoading && (
                    <tr><td colSpan={3} className="px-6 py-8 text-center text-white/30">Sin datos</td></tr>
                  )}
                  {data.combos?.map((combo: any, i: number) => (
                    <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-medium">{combo.blackCardText}</td>
                      <td className="px-6 py-4 text-white/80">{combo.whiteCardText}</td>
                      <td className="px-6 py-4 text-right font-bold text-[#e94560]">{combo.timesWon}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Card Comparator */}
          <CardComparator />
        </div>
      </ScrollArea>
    </div>
  );
}
