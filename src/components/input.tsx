import type { ChangeEventHandler } from "react"

interface InputProps {
  label: string
  name: string
  type?: string
  value?: string | number
  onChange?: ChangeEventHandler<HTMLInputElement>
  required?: boolean
  placeholder?: string
}

const Input = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  required = false,
  placeholder = '',
}: InputProps) => {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <input
        type={type}
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className="block w-full p-2 mt-1 border text-black border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm "
      />
    </div>
  )
}

export default Input