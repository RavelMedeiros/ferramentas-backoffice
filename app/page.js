"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react"; // Importando o ícone Loader2
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const getRandomDate = () => {
  const start = new Date(2024, 0, 1);
  const end = new Date(2024, 11, 31);
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const formatDateForBackend = (date, isEndOfDay = false) => {
  const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
  const monthName = date.toLocaleDateString("en-US", { month: "short" });
  const year = date.getFullYear();
  const day = String(date.getDate()).padStart(2, "0");
  const time = isEndOfDay ? "23:59:59" : "00:00:00";
  const timezone = date.toTimeString().match(/\(.*?\)/)?.[0]?.replace(/[()]/g, "GMT");
  return `${dayName} ${monthName} ${day} ${year} ${time} GMT-0400`;
};

const getAuthToken = async () => {
  try {
    const response = await fetch(
      "https://candidate.homolog.meutudo.app/tudo/v2/logintoken",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: "admin", password: "123124" }),
      }
    );

    if (!response.ok) {
      throw new Error("Erro ao obter o token de autenticação");
    }

    const result = await response.json();
    return result.resource.authenticationToken;
  } catch (error) {
    console.error("Erro na autenticação:", error.message);
    throw error;
  }
};

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchRandomPersonWithContract = async () => {
    setLoading(true);
    setError(null);
    setData([]);

    try {
      const token = await getAuthToken();
      let foundOpportunity = false;
      let personWithOpportunity = null;

      while (!foundOpportunity) {
        const randomDate = getRandomDate();
        const startDate = formatDateForBackend(randomDate);
        const endDate = formatDateForBackend(randomDate, true);

        const response = await fetch(
          `https://candidate.homolog.meutudo.app/tudo/v2/admin/personcustom/people?startDate=${encodeURIComponent(
            startDate
          )}&endDate=${encodeURIComponent(endDate)}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json, text/plain, */*",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erro ao buscar os dados: ${response.statusText}`);
        }

        const result = await response.json();
        const entries = result.resource.entries;

        for (const entry of entries) {
          const opportunityResponse = await fetch(
            `https://candidate.homolog.meutudo.app/tudo/v2/admin/personcustom/people/opportunities?personId=${entry.id}&agreementId=42`,
            {
              method: "GET",
              headers: {
                Accept: "application/json, text/plain, */*",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (opportunityResponse.ok) {
            const opportunityData = await opportunityResponse.json();
            if (opportunityData.resource.length > 0) {
              personWithOpportunity = {
                id: entry.id,
                name: entry.name,
                registrationStatus: entry.registrationStatus,
                registrationDate: entry.registrationDate,
              };
              foundOpportunity = true;
              break;
            }
          }
        }
      }

      if (personWithOpportunity) {
        setData([personWithOpportunity]);
        setIsModalOpen(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIconClick = (id) => {
    const url = `https://backoffice.homolog.meutudo.app/backoffice/people/${id}?aux=opportunities`;
    window.open(url, "_blank");
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 text-gray-900">
      {/* Header */}
      <header className="py-6 bg-pink-600 text-white">
        <div className="container mx-auto text-center">
          <h1 className="text-3xl font-semibold">Ferramentas do Backoffice</h1>
          <p className="mt-2 text-sm">
            Explore dados e funcionalidades para otimizar processos internos.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto my-8">
        <Card className="w-full max-w-lg mx-auto">
          <CardHeader>
            <CardTitle>Pessoa com Oportunidade</CardTitle>
            <CardDescription>
              Encontre pessoas com oportunidades disponíveis de forma aleatória.
            </CardDescription>
          </CardHeader>
          <div className="px-6 pb-6">
            <Button
              onClick={fetchRandomPersonWithContract}
              disabled={loading}
              className="w-full bg-pink-600 hover:bg-pink-500 text-white flex justify-center items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2" />
                  A busca pode levar um tempo, por favor, aguarde...
                </>
              ) : (
                "Buscar"
              )}
            </Button>
            {error && <p className="text-red-500 mt-4">Erro: {error}</p>}
          </div>
        </Card>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Pessoa com Oportunidade</DialogTitle>
            </DialogHeader>
            <div className="overflow-y-auto max-h-80">
              {loading ? (
                <p className="text-center text-gray-500">Carregando... Isso pode levar alguns segundos.</p>
              ) : data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Data Registro</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.id}</TableCell>
                        <TableCell>{entry.name}</TableCell>
                        <TableCell>{entry.registrationStatus}</TableCell>
                        <TableCell>{formatDateForBackend(new Date(entry.registrationDate))}</TableCell>
                        <TableCell>
                          <button
                            onClick={() => handleIconClick(entry.id)}
                            className="text-pink-600 underline"
                          >
                            Ver
                          </button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-center text-gray-500">Nenhum dado encontrado.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </main>

      {/* Footer */}
      <footer className="py-6 bg-gray-200 text-center">
        <p className="text-sm">
          Tem uma sugestão ou encontrou um problema?{" "}
          <a
            href="https://mountain-appliance-784.notion.site/148ea5a23db480a2b285c570ebf34b28?pvs=105"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-600 underline"
          >
            Preencha este formulário
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
