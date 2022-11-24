import { createContext, ReactNode, useState } from 'react';

export const InputContext = createContext<InputContextProps>({
  input: '',
  updateInput: function (value: string): void {
    throw new Error('Update Nçao Funcionou.');
  },
  resetInput: function (): void {
    throw new Error('Reset não funcionou.');
  }
});

interface Props {
  children: ReactNode
}

interface InputContextProps {
  input: string
  updateInput: (value: string) => void
  resetInput: () => void
}

export const ContextInput = ({ children }: Props) => {
  const [input, setInput] = useState('')
  const updateInput = (value: string) => { setInput(value) }
  const resetInput = () => { setInput("") }
  return (
    <InputContext.Provider value={{ input, updateInput, resetInput }} >{children}</InputContext.Provider>
  )
}
