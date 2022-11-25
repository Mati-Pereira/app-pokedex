import { createContext, ReactNode, useState } from 'react';

export const InputContext = createContext<InputContextProps>({
  input: '',
  updateInput: function (value: string): void {
    throw new Error('Update não Funcionou.');
  },
});

interface Props {
  children: ReactNode
}

interface InputContextProps {
  input: string
  updateInput: (value: string) => void
}

export const ContextInput = ({ children }: Props) => {

  const [input, setInput] = useState('')
  const updateInput = (value: string) => { setInput(value) }
  return (
    <InputContext.Provider value={{ input, updateInput }} >{children}</InputContext.Provider>
  )
}
