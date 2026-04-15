import { useState, useEffect } from "react";

interface IBGEState {
  id: number;
  sigla: string;
  nome: string;
}

interface IBGECity {
  id: number;
  nome: string;
}

export const useIBGEStates = () => {
  const [states, setStates] = useState<IBGEState[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data) => {
        setStates(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar estados");
        setLoading(false);
      });
  }, []);

  return { states, loading, error };
};

export const useIBGECities = (uf: string) => {
  const [cities, setCities] = useState<IBGECity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uf) {
      setCities([]);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then((res) => res.json())
      .then((data) => {
        setCities(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar cidades");
        setLoading(false);
      });
  }, [uf]);

  return { cities, loading, error };
};
