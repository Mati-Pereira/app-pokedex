import { useQuery } from '@tanstack/react-query';
import { createContext, ReactNode, useState } from 'react';

export const InputContext = createContext<InputContextProps>({
  input: '',
  updateInput: function (value: string): void {
    throw new Error('Update não Funcionou.');
  },
  pokemonNames: [],
  isLoading: false,
  isError: false
});

interface Props {
  children: ReactNode
}

interface InputContextProps {
  input: string
  updateInput: (value: string) => void
  pokemonNames: string[]
  isLoading: boolean
  isError: boolean
}

export const ContextInput = ({ children }: Props) => {

  const { data, isLoading, isError } = useQuery(["repoData"], async () => {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon?offset=0&limit=1155`)
    const data = await res.json()
    const pokemons = data?.results
    const pokemonNames = pokemons?.map((pokemon: { name: string }) => pokemon.name)
    return pokemonNames
  })

  const pokemonNames = data ?? []


  const [input, setInput] = useState('')
  const updateInput = (value: string) => { setInput(value) }
  return (
    <InputContext.Provider value={{ input, updateInput, pokemonNames, isLoading, isError }} >{children}</InputContext.Provider>
  )
}
