interface SelectProps {
  options: any[];
  value: any; // permitir boolean/number
  onChange: (event: { target: { name: string; value: string } }) => void;
  name: string; 
  label: string;
  required: boolean;
  disabled: boolean;
  message: string; 
}

export default function Select({
  options,
  value,
  onChange,
  name,
  label,
  required,
  disabled,
  message
}: SelectProps) {
 
  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    onChange({ target: { name, value } });
  };

  const normalizedValue = value === undefined || value === null ? '' : String(value);
  let selectedValue = options?.find((option) => option?.selecionado);

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-gray-700 uppercase">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
      	id={name}
      	name={name}
      	className="mt-1 p-2 w-full border rounded-md bg-white"
      	value={selectedValue ? String(selectedValue.chave) : normalizedValue}
      	onChange={handleSelectChange}
        disabled={disabled}
        required={required}
      >
      	<option value="">{message}</option>
      	{options && options.map(
			(option: any, optionIdx: any) => (
				<option key={optionIdx} value={String(option.chave)}>{option.valor}</option>
			)
			)}
	  </select>
    </div>
  );
}
