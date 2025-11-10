// app/search/page.tsx
"use client";

import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");

  return (
    <div className="p-4 w-full max-w-md min-h-200 "> 
      <div className="relative w-full">
        <input
          value={query}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
          className="p-2 w-full bg-white text-black h-10 rounded-lg pr-10"
          placeholder="Search..."
        />
        <button
          className="absolute top-1/2 right-3 -translate-y-1/2 bg-transparent text-black text-xl"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      </div>

      <div className="mt-2">
        {query.length > 1 ? (
          <div>{query}</div>
        ) : (
          <div className="text-gray-500">Write something to display here</div>
        )}
      </div>
     
      <div className="text-dark-accent p-10">Lorem ipsum dolor sit amet, consectetur adipisicing elit. Commodi provident facere voluptatum magnam voluptates, corrupti nulla, optio nostrum minus odio eum. Quas ex fuga debitis atque hic, quae repudiandae perferendis?</div>
    </div>
  );
}
