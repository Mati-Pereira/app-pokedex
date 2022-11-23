interface Props {
  pokemonType: string
}

function Types({ pokemonType }: Props) {
  return (
    <div className="py-5">
      <span className="inline-block bg-gray-200 rounded-full px-3 py-1 text-sm font-semibold text-gray-700 mr-2 mb-2">{pokemonType}</span>
    </div>
  );
}

export default Types;